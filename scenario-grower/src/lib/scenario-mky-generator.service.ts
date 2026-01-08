import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScenarioMkyGeneratorService {
  private idCounter = 1;
  private wires: string[] = [];
  private items: string[] = [];
  private inVariableIds: number[] = [];
  private outVariableIds: number[] = [];

  constructor() {}

  /**
   * Generates the full XML content for a .mky file containing the wiring logic.
   */
  generateMinskyXML(
    tensorName: string,
    paramNames: string[],
    scenarioNames: string[], // Actual scenario names to use
    paramAxisName: string = 'name',      // Axis name for parameter (column) selection
    scenarioAxisName: string = 'attribute', // Axis name for scenario (row) selection
    totalAttributeCount: number = 0 // Total number of attributes in the tensor (including metadata)
  ): string {
    // Reset state for new generation
    this.idCounter = 1;
    this.wires = [];
    this.items = [];
    this.inVariableIds = [];
    this.outVariableIds = [];

    const startX = 0;
    const startY = 0;
    const spacingY = 80; // Vertical space between rows

    // Calculate scenario offset (metadata columns that come before actual scenarios)
    const scenarioOffset = totalAttributeCount - scenarioNames.length;

    // --- 1. Create Inputs (acting as Group Inputs) ---

    // The Main Tensor Input
    const tensorItem = this.createVariableItem(
      `:${tensorName}`,
      startX,
      startY + (paramNames.length * spacingY) / 2, // Center it vertically
      'parameter'
    );
    this.inVariableIds.push(tensorItem.id); // Mark as group input

    // The Scenario Selector Input (0-based, will be offset)
    const selectorItem = this.createVariableItem(
      ':SelectedScenario',
      startX,
      startY - 100, // Place it slightly above
      'parameter',
      '0',
      `Select Scenario (0-${scenarioNames.length - 1}): ${scenarioNames.join(', ')}`
    );
    this.inVariableIds.push(selectorItem.id); // Mark as group input

    // The Scenario Offset Constant (to skip metadata columns)
    const offsetItem = this.createVariableItem(
      ':ScenarioOffset',
      startX,
      startY - 180, // Place it further above
      'parameter',
      scenarioOffset.toString(),
      `Offset to skip metadata columns (${scenarioOffset})`
    );
    this.inVariableIds.push(offsetItem.id); // Mark as group input

    // Add operation to calculate adjusted scenario index
    const addOp = this.createAddOperation(startX + 150, startY - 140);
    this.addWire(selectorItem.ports[0], addOp.ports[1]); // SelectedScenario -> add input 1
    this.addWire(offsetItem.ports[0], addOp.ports[2]); // ScenarioOffset -> add input 2

    // --- 2. Create Rows for each Parameter ---

    paramNames.forEach((paramName, index) => {
      const y = startY + (index * spacingY);

      // A. The Constant Index for this parameter
      // This tells the gather which ROW to pick.
      const idxItem = this.createVariableItem(
        `:idx_${paramName}`,
        startX + 200,
        y,
        'parameter',
        index.toString(), // Init value = index
        `Index for ${paramName}`
      );

      // B. Gather 1: Selects the column (parameter) using its index
      const gatherName = this.createGatherItem(startX + 400, y, paramAxisName);

      // C. Gather 2: Selects the row (scenario) using SelectedScenario
      const gatherAttr = this.createGatherItem(startX + 600, y, scenarioAxisName);

      // D. The Output Variable (flow type for outputs)
      const outputItem = this.createVariableItem(
        `:${paramName}`,
        startX + 800,
        y,
        'flow', // Flow variables have input and output ports
        '0'
      );
      this.outVariableIds.push(outputItem.id); // Mark as group output

      // --- WIRING ---
      // Based on test/testTensorOps.cc:
      // - gatherOp->ports(0) = output
      // - gatherOp->ports(1) = data input
      // - gatherOp->ports(2) = index input
      // - variable->ports(0) = output
      // - variable->ports(1) = input (for flow variables)

      // 1. Tensor (output port 0) -> Gather Name (data input port 1)
      this.addWire(tensorItem.ports[0], gatherName.ports[1]);

      // 2. Index Constant (output port 0) -> Gather Name (index input port 2)
      this.addWire(idxItem.ports[0], gatherName.ports[2]);

      // 3. Gather Name (output port 0) -> Gather Attribute (data input port 1)
      this.addWire(gatherName.ports[0], gatherAttr.ports[1]);

      // 4. Adjusted Scenario Index (add output port 0) -> Gather Attribute (index input port 2)
      this.addWire(addOp.ports[0], gatherAttr.ports[2]);

      // 5. Gather Attribute (output port 0) -> Output Variable (input port 1)
      this.addWire(gatherAttr.ports[0], outputItem.ports[1]);
    });

    // --- 3. Construct Final XML ---
    const inVarsXml = this.inVariableIds.map(id => `    <int>${id}</int>`).join('\n');
    const outVarsXml = this.outVariableIds.map(id => `    <int>${id}</int>`).join('\n');

    return `<?xml version="1.0"?>
<Minsky xmlns="http://minsky.sf.net/minsky">
  <schemaVersion>3</schemaVersion>
  <wires>
${this.wires.map(w => '    ' + w).join('\n')}
  </wires>
  <items>
${this.items.map(i => '    ' + i).join('\n')}
  </items>
  <inVariables>
${inVarsXml}
  </inVariables>
  <outVariables>
${outVarsXml}
  </outVariables>
  <groups>
  </groups>
</Minsky>`;
  }

  // --- Helper Methods ---

  private createVariableItem(
    name: string, 
    x: number, 
    y: number, 
    type: 'parameter'|'flow'|'constant', 
    init = '0', 
    tooltip = ''
  ): { id: number, ports: number[] } {
    const id = this.nextId();
    
    // Port structure based on variable type:
    // - parameter: 1 port (output)
    // - flow: 2 ports (output, input)
    // - constant: 1 port (output)
    const ports: number[] = [];
    if (type === 'flow') {
      ports.push(this.nextId()); // output port
      ports.push(this.nextId()); // input port
    } else {
      ports.push(this.nextId()); // output port only
    }
    
    const portsXml = ports.map(p => `     <int>${p}</int>`).join('\n');
    
    const xml = `   <Item>
     <id>${id}</id>
     <type>Variable:${type}</type>
     <name>${this.escapeXml(name)}</name>
     <x>${x}</x>
     <y>${y}</y>
     <zoomFactor>1</zoomFactor>
     <rotation>0</rotation>
     <width>10</width>
     <height>10</height>
     <ports>
${portsXml}
     </ports>
     <init>${this.escapeXml(init)}</init>
     <slider>
      <visible>false</visible>
      <stepRel>false</stepRel>
      <min>-1</min>
      <max>1</max>
      <step>0.1</step>
     </slider>
     ${tooltip ? `<tooltip>${this.escapeXml(tooltip)}</tooltip>` : ''}
   </Item>`;
    
    this.items.push(xml);
    return { id, ports };
  }

  private createGatherItem(x: number, y: number, axis: string): { id: number, ports: number[] } {
    const id = this.nextId();
    // Gather has 3 ports: Output (0), Data Input (1), Index Input (2)
    const pOut = this.nextId();
    const pData = this.nextId();
    const pIdx = this.nextId();

    const xml = `   <Item>
     <id>${id}</id>
     <type>Operation:gather</type>
     <x>${x}</x>
     <y>${y}</y>
     <zoomFactor>1</zoomFactor>
     <rotation>0</rotation>
     <width>10</width>
     <height>10</height>
     <ports>
     <int>${pOut}</int>
     <int>${pData}</int>
     <int>${pIdx}</int>
     </ports>
     <axis>${axis}</axis>
   </Item>`;

    this.items.push(xml);
    return { id, ports: [pOut, pData, pIdx] };
  }

  private createAddOperation(x: number, y: number): { id: number, ports: number[] } {
    const id = this.nextId();
    // Binary operations have 3 ports: Output (0), Input 1 (1), Input 2 (2)
    const pOut = this.nextId();
    const pIn1 = this.nextId();
    const pIn2 = this.nextId();

    const xml = `   <Item>
     <id>${id}</id>
     <type>Operation:add</type>
     <x>${x}</x>
     <y>${y}</y>
     <zoomFactor>1</zoomFactor>
     <rotation>0</rotation>
     <width>10</width>
     <height>10</height>
     <ports>
     <int>${pOut}</int>
     <int>${pIn1}</int>
     <int>${pIn2}</int>
     </ports>
   </Item>`;

    this.items.push(xml);
    return { id, ports: [pOut, pIn1, pIn2] };
  }

  private addWire(fromPort: number, toPort: number) {
    const id = this.nextId();
    const xml = `   <Wire>
     <id>${id}</id>
     <from>${fromPort}</from>
     <to>${toPort}</to>
   </Wire>`;
    this.wires.push(xml);
  }

  private nextId(): number {
    return this.idCounter++;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
