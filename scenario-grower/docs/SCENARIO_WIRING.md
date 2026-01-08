# Scenario Wiring Documentation

## Overview

The Scenario Wiring feature automatically generates Minsky model infrastructure to extract parameter values from a scenario tensor. It creates a complete wiring diagram with gather operations, index variables, and output flow variables that allow users to select different scenarios and extract parameter values dynamically.

## Architecture

The scenario wiring system uses **XML generation and loading** to create Minsky model elements, rather than programmatically creating canvas items. This approach:

- Avoids complex canvas item searching and matching
- Ensures correct port connections and wiring
- Creates a clean, self-contained group that can be easily positioned
- Leverages Minsky's native XML loading capabilities

### Components

1. **ScenarioWiringComponent** - Angular UI component for user interaction
2. **ScenarioMkyGeneratorService** - Generates Minsky XML (.mky) format
3. **ScenarioWiringService** - Reads tensor structure from existing variables
4. **IPC Handlers** - File system operations for temporary file management

## Data Flow

```
User Input (Tensor Name)
    ↓
ScenarioWiringService.readTensorStructure()
    ↓
Extract: paramNames, scenarioNames from tensor hypercube
    ↓
ScenarioMkyGeneratorService.generateMinskyXML()
    ↓
Generate XML with variables, gather operations, and wires
    ↓
Write to temp file via IPC
    ↓
Load into Minsky via insertGroupFromFile()
    ↓
Clean up temp file
```

## Wiring Logic

### Group Inputs/Outputs

The generated group has three **input variables** (exposed on the left boundary):
- **ScenarioTensor** - The source tensor containing all parameter data
- **SelectedScenario** - User-controlled index (0 to N-1) selecting which scenario to extract
- **ScenarioOffset** - Automatically calculated offset to skip metadata columns in the tensor

The output variables (exposed on the right boundary) are the parameter variables:
- **ParamName** (one for each parameter) - Flow variables containing extracted values

### Port Structure

- **Gather Operations**: 3 ports
  - Port 0: Output
  - Port 1: Data Input (tensor/row data)
  - Port 2: Index Input (which row/column to extract)

- **Parameter Variables**: 1 port
  - Port 0: Output

- **Flow Variables**: 2 ports
  - Port 0: Output
  - Port 1: Input (for receiving values)

- **Add Operation**: 3 ports
  - Port 0: Output (sum)
  - Port 1: Input (first operand)
  - Port 2: Input (second operand)

### Wiring Connections

For each parameter row, the system wires:

```
ScenarioTensor (output)
  → Gather Name (data input, port 1)

idx_ParamName (output, constant = parameter column index)
  → Gather Name (index input, port 2)

Gather Name (output)
  → Gather Attribute (data input, port 1)

SelectedScenario + ScenarioOffset (via add operation output)
  → Gather Attribute (index input, port 2)

Gather Attribute (output)
  → ParamName (input port, port 1)
```

### Offset Calculation

The `ScenarioOffset` variable is critical for handling CSV imports that include metadata rows:
- When a CSV is imported with columns like `[name, type, units, description, init, CON, OPT, IDL]`
- The tensor's "attribute" dimension includes all these columns
- Actual scenario data (CON, OPT, IDL) may start at a non-zero index
- `ScenarioOffset = Total Attributes - Number of Selected Scenarios`
- The add operation calculates: `Actual Index = SelectedScenario + ScenarioOffset`

This allows users to control scenario selection with a simple 0-based index while the system internally maps to the correct column positions.

## Component: ScenarioWiringComponent

### Purpose
Angular component that provides the user interface for wiring scenario parameters.

### Location
`src/lib/scenario-wiring.component.ts`

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `tensorName` | `string` | User-input tensor variable name |
| `metadata` | `TensorMetadata \| null` | Detected tensor structure |
| `numScenarioRows` | `number` | Number of scenario rows to use (default: 3) |
| `loading` | `boolean` | Loading state for structure detection |
| `wiring` | `boolean` | Loading state for wiring operation |
| `error` | `string` | Error message display |
| `success` | `string` | Success message display |

### Methods

#### `detectStructure(): Promise<void>`
Detects the structure of the specified tensor variable.

**Process:**
1. Calls `wiringService.readTensorStructure(tensorName)`
2. Extracts parameter names and scenario names from tensor hypercube
3. Sets `metadata` with detected structure
4. Defaults `numScenarioRows` to minimum of 3 or total scenarios

**Errors:**
- Variable not found
- Cannot read tensor structure
- Missing hypercube data

#### `wireParameters(): Promise<void>`
Generates and loads the wiring infrastructure into Minsky.

**Process:**
1. Generates XML using `mkyGenerator.generateMinskyXML()`
2. Writes XML to temporary file via IPC (`write-temp-file`)
3. Loads XML as a group using `minsky.insertGroupFromFile()`
4. Cleans up temporary file via IPC (`delete-file`)

**Parameters:**
- Uses `metadata.paramNames` for parameter list
- Uses last `numScenarioRows` from `metadata.scenarioNames`
- Uses `tensorName` for tensor variable reference

**Success Message:**
Displays count of created parameter variables and scenarios.

#### `reset(): void`
Resets the component state, clearing metadata and messages.

### Template Structure

1. **Step 1**: Tensor name input and "Detect Structure" button
2. **Step 2**: Display detected structure with parameter/scenario lists
3. **Step 3**: Number of scenario rows input and "Wire Parameters" button
4. **Progress**: Loading spinner during operations
5. **Feedback**: Error and success messages

## Service: ScenarioMkyGeneratorService

### Purpose
Generates Minsky XML format (.mky file content) for scenario wiring infrastructure.

### Location
`src/lib/scenario-mky-generator.service.ts`

### State Management

The service maintains internal state during XML generation:

- `idCounter`: Unique ID generator for items, ports, and wires
- `wires`: Array of wire XML snippets
- `items`: Array of item XML snippets

State is reset at the start of each `generateMinskyXML()` call.

### Methods

#### `generateMinskyXML(tensorName, paramNames, scenarioNames, paramAxisName, scenarioAxisName, totalAttributeCount): string`

Main method that generates the complete Minsky XML document.

**Parameters:**
- `tensorName: string` - Name of the tensor variable (without colon prefix)
- `paramNames: string[]` - Array of parameter names (column names)
- `scenarioNames: string[]` - Array of scenario/attribute names to use (row names, determines scenario count)
- `paramAxisName: string` - Actual axis name for parameters in the tensor (default: `'name'`)
- `scenarioAxisName: string` - Actual axis name for scenarios in the tensor (default: `'attribute'`)
- `totalAttributeCount: number` - Total number of attributes in the tensor including metadata (used to calculate offset)

**Returns:**
Complete XML string in Minsky .mky format with proper group input/output boundaries

**Process:**
1. Resets internal state (idCounter, wires, items, inVariableIds, outVariableIds)
2. Calculates `scenarioOffset = totalAttributeCount - scenarioNames.length`
3. Creates input variables (marked on left boundary):
   - Tensor variable (`:${tensorName}`) - data source
   - SelectedScenario variable (`:SelectedScenario`) - user-controlled scenario selector
   - ScenarioOffset variable (`:ScenarioOffset`) - calculated offset to skip metadata
4. Creates add operation to compute adjusted scenario index: `SelectedScenario + ScenarioOffset`
5. For each parameter:
   - Creates index variable (`:idx_${paramName}`) with initial value = parameter column index
   - Creates first gather operation (axis: dynamic, from `paramAxisName`)
   - Creates second gather operation (axis: dynamic, from `scenarioAxisName`)
   - Creates output flow variable (`:${paramName}`) - marked on right boundary
   - Creates all 5 wire connections
6. Constructs final XML with group boundaries:
   ```xml
   <?xml version="1.0"?>
   <Minsky xmlns="http://minsky.sf.net/minsky">
     <schemaVersion>3</schemaVersion>
     <wires>...</wires>
     <items>...</items>
     <inVariables><int>...</int>...</inVariables>
     <outVariables><int>...</int>...</outVariables>
     <groups></groups>
   </Minsky>
   ```

**Layout:**
- `startX = 0`, `startY = 0`
- Vertical spacing: `spacingY = 80` pixels between parameter rows
- Input variables positioned at `x = 0` (left), centered vertically for tensor
- Add operation at `x = 150, y = -140`
- Index variables at `x = 200`
- First gather (parameter selection) at `x = 400`
- Second gather (scenario selection) at `x = 600`
- Output variables at `x = 800` (right)
- ScenarioOffset positioned at `y = -180`, SelectedScenario at `y = -100`

**Dynamic Axis Names:**
The gather operations now use the actual axis names from the tensor's hypercube structure, allowing the system to work with tensors that have different dimension naming conventions (not just hardcoded `'name'` and `'attribute'`).

#### `createVariableItem(name, x, y, type, init, tooltip): { id, ports }`

Creates a variable item XML snippet.

**Parameters:**
- `name: string` - Variable name (with colon prefix, e.g., `:ParamName`)
- `x: number` - X coordinate
- `y: number` - Y coordinate
- `type: 'parameter'|'flow'|'constant'` - Variable type
- `init: string` - Initial value (default: `'0'`)
- `tooltip: string` - Tooltip text (default: `''`)

**Returns:**
Object with `id` (item ID) and `ports` (array of port IDs)

**Port Structure:**
- `parameter`: 1 port (output)
- `flow`: 2 ports (output, input)
- `constant`: 1 port (output)

**XML Fields:**
- `id`, `type`, `name`, `x`, `y`
- `zoomFactor`, `rotation`, `width`, `height`
- `ports` (array of port IDs)
- `init` (initial value)
- `slider` (default slider configuration)
- `tooltip` (if provided)

**XML Escaping:**
Variable names and initial values are XML-escaped using `escapeXml()`.

#### `createGatherItem(x, y, axis): { id, ports }`

Creates a gather operation item XML snippet.

**Parameters:**
- `x: number` - X coordinate
- `y: number` - Y coordinate
- `axis: string` - Gather axis name (dynamically determined from tensor, e.g., `'name'`, `'attribute'`)

**Returns:**
Object with `id` (item ID) and `ports` (array of 3 port IDs)

**Port Structure:**
- Port 0: Output
- Port 1: Data Input
- Port 2: Index Input

**XML Fields:**
- `id`, `type` (`Operation:gather`), `x`, `y`
- `zoomFactor`, `rotation`, `width`, `height`
- `ports` (3 ports: output, data input, index input)
- `axis` (dynamic value from tensor's xvector names)

#### `createAddOperation(x, y): { id, ports }`

Creates an add operation (binary sum) for computing adjusted scenario index.

**Parameters:**
- `x: number` - X coordinate
- `y: number` - Y coordinate

**Returns:**
Object with `id` (item ID) and `ports` (array of 3 port IDs)

**Port Structure:**
- Port 0: Output (sum)
- Port 1: Input (first operand)
- Port 2: Input (second operand)

**Purpose:**
Used to calculate: `Actual Scenario Index = SelectedScenario + ScenarioOffset`

**XML Fields:**
- `id`, `type` (`Operation:add`), `x`, `y`
- `zoomFactor`, `rotation`, `width`, `height`
- `ports` (3 ports: output, input1, input2)

#### `addWire(fromPort, toPort): void`

Adds a wire XML snippet to the internal wires array.

**Parameters:**
- `fromPort: number` - Source port ID
- `toPort: number` - Destination port ID

**XML Structure:**
```xml
<Wire>
  <id>{uniqueId}</id>
  <from>{fromPort}</from>
  <to>{toPort}</to>
</Wire>
```

#### `nextId(): number`

Generates the next unique ID for items, ports, and wires.

**Returns:**
Incrementing integer starting from 1

#### `escapeXml(str): string`

Escapes XML special characters in strings.

**Escaping Rules:**
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&apos;`

## Service: ScenarioWiringService

### Purpose
Reads tensor structure from existing Minsky variables and provides helper methods for variable access.

### Location
`src/lib/scenario-wiring.service.ts`

### Methods

#### `getVariableValue(name): Promise<any | null>`

Gets a VariableValue object by name.

**Parameters:**
- `name: string` - Variable name (with or without colon prefix)

**Returns:**
VariableValue object or `null` if not found

**Process:**
- Normalizes name to include colon prefix if missing
- Accesses `minsky.variableValues.elem(name)`
- Returns `null` on error

#### `readTensorStructure(tensorName): Promise<TensorMetadata | null>`

Reads the structure of a tensor variable from its hypercube.

**Parameters:**
- `tensorName: string` - Name of the tensor variable

**Returns:**
`TensorMetadata` object or `null` on error

**TensorMetadata Interface:**
```typescript
{
    paramNames: string[];         // Column names (xvectors[0].slices)
    scenarioNames: string[];      // Row names (xvectors[1].slices)
    numParams: number;            // Count of parameters
    numScenarios: number;         // Count of scenarios (total, including metadata rows)
    paramAxisName: string;        // Actual axis name for parameters (xvectors[0].name)
    scenarioAxisName: string;     // Actual axis name for scenarios (xvectors[1].name)
}
```

**Process:**
1. Gets VariableValue for tensor name
2. Accesses `hypercube()` method
3. Extracts `xvectors[0].slices` as parameter names (columns)
4. Extracts `xvectors[1].slices` as scenario names (rows)
5. Extracts `xvectors[0].name` as the parameter axis name (critical for gather operations)
6. Extracts `xvectors[1].name` as the scenario axis name (critical for gather operations)
7. Validates that both arrays have length > 0
8. Returns metadata object with axis names

**Errors:**
- Variable not found
- Cannot access hypercube
- Missing xvector slices
- Empty parameter or scenario arrays

#### `findCanvasItemRecursive(exactName): Promise<any | null>`

Recursively searches for a canvas item by name.

**Note:** This method is currently not used by the XML generation approach, but is kept for potential future use.

**Process:**
- Searches top-level items
- Recursively searches inside groups
- Uses `checkItemByName()` for matching logic

#### `checkItemByName(item, exactName, depth): Promise<any | null>`

Recursively checks if an item matches the name and searches inside groups.

**Matching Logic:**
- For variables: Wraps in `VariableBase` to get name
- For other items: Tries direct `name()` access
- Matches exact name or variations with/without colon prefix

## IPC Handlers

### Purpose
Provide file system operations for temporary file management in the Electron main process.

### Location
`src/lib/ipc-handlers.ts`

### Registration

IPC handlers are registered via the modding system:

1. **Manifest Declaration** (`manifest.json`):
   ```json
   "ipc": [
     { "channel": "write-temp-file" },
     { "channel": "delete-file" }
   ]
   ```

2. **Handler Implementation** (`ipc-handlers.ts`):
   Exported `ipcHandlers` object with handler functions

3. **Automatic Registration**:
   The modding system automatically registers these handlers in `bootstrapElectronEvents()`

### Handlers

#### `write-temp-file`

Writes content to a temporary file and returns the file path.

**Parameters:**
- `content: string` - File content to write
- `filename: string` - Filename (will be placed in temp directory)

**Returns:**
Full path to the temporary file

**Implementation:**
```typescript
'write-temp-file': async (content: string, filename: string) => {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, filename);
    fs.writeFileSync(tempFile, content, 'utf-8');
    return tempFile;
}
```

**Usage:**
Called from renderer process via `electron.invoke('write-temp-file', content, filename)`

#### `delete-file`

Deletes a file from the file system.

**Parameters:**
- `filePath: string` - Full path to file to delete

**Returns:**
`true` if successful, `false` on error

**Implementation:**
```typescript
'delete-file': async (filePath: string) => {
    try {
        fs.unlinkSync(filePath);
        return true;
    } catch (e) {
        console.warn('Failed to delete file:', e);
        return false;
    }
}
```

**Error Handling:**
Logs warning on failure but returns `false` (non-throwing)

**Usage:**
Called from renderer process via `electron.invoke('delete-file', filePath)`

## Usage Workflow

### Step 1: Prepare Tensor Variable (CSV Structure Best Practices)

**Best Practice: Scenario-Specific CSVs**

Create separate CSV files for different scenario sets. Each CSV should contain **only the parameters that vary by scenario**:

```csv
name,type,units,description,init,CON,OPT,IDL
InnovationRateMicro,parameter,1/year,...,,0.02,0.04,0.06
ImitationRateMicro,parameter,1/year,...,,0.025,0.05,0.1
PopulationSize,parameter,people,...,1000000
TimeHorizon,constant,years,...,50
```

**Important Notes:**
- Metadata rows (type, units, description, init) are included in the "attribute" dimension
- The system automatically calculates `ScenarioOffset` to skip metadata columns
- For this example with 4 metadata columns + 3 scenarios: offset = 4
- When `SelectedScenario=0`, it maps to `Actual Index = 0 + 4 = 4` (the CON column)
- Parameters that don't vary by scenario should use a separate "parameters-global.csv" (loaded separately)

**Import Instructions:**
1. Import CSV via Minsky's CSV import feature
2. Ensure it creates a tensor variable with proper hypercube structure
3. Verify the tensor has:
   - Column names (parameter names) in `xvectors[0].slices`
   - Row names (metadata + scenario names) in `xvectors[1].slices`
   - Proper axis names in `xvectors[0].name` and `xvectors[1].name`

### Step 2: Open Wiring Dialog

1. Navigate to **Simulation** menu
2. Select **"Wire Scenario Parameters..."**
3. Dialog opens with tensor name input field

### Step 3: Detect Structure

1. Enter the tensor variable name (e.g., `ScenarioTensor` or `:ScenarioTensor`)
2. Click **"Detect Structure"**
3. System reads tensor hypercube and displays:
   - Parameter names (columns)
   - Scenario names (rows)
   - Counts for each

### Step 4: Configure Wiring

1. Review detected structure
2. Set **"Number of Scenario Rows"** (default: 3)
   - This determines how many scenarios from the bottom of the list will be used
   - Metadata rows (type, units, etc.) are typically excluded
3. Click **"Wire Parameters"**

### Step 5: Generated Infrastructure

The system creates a self-contained group with inputs on the left boundary and outputs on the right:

**Input Variables (Group Boundaries - Left Side):**
- `:ScenarioTensor` - The source tensor containing all parameter data
- `:SelectedScenario` - User-controlled scenario selector (0 to N-1, simple 0-based index)
- `:ScenarioOffset` - Automatically calculated offset (internally used, pre-set to the correct value)

**Internal Operations (For Each Parameter):**
- `:idx_{ParamName}` - Index constant matching the parameter's column position in the tensor
- First `gather` operation (axis: parameter axis) - Selects the parameter's row
- Second `gather` operation (axis: scenario axis) - Selects the scenario's value
- One `add` operation (shared) - Computes `SelectedScenario + ScenarioOffset` for correct column indexing

**Output Variables (Group Boundaries - Right Side):**
- `:{ParamName}` - Flow variable containing the extracted parameter value (one per parameter)

**Wiring:** Complete data flow from tensor through gather operations to parameter outputs, with offset-adjusted scenario indexing

### Step 6: Use the Infrastructure

1. The generated group appears on the canvas
2. The `ScenarioTensor` input expects the tensor variable to be connected (or pre-populated)
3. Set `SelectedScenario` to the desired scenario index:
   - `0` = first scenario in your list
   - `1` = second scenario
   - etc.
4. The `ScenarioOffset` is pre-calculated and typically doesn't need manual adjustment
5. Each parameter variable (`:{ParamName}`) on the right boundary contains the extracted value
6. Connect parameter variables to other parts of your model as needed

## Technical Details

### XML Format Compliance

The generated XML follows Minsky's schema version 3 format:

- Proper namespace: `http://minsky.sf.net/minsky`
- Schema version: `3`
- All required fields for items (id, type, x, y, zoomFactor, rotation, width, height)
- Proper port structure for each item type
- XML escaping for names and values
- **Group Boundaries:** Uses `<inVariables>` and `<outVariables>` sections to define group inputs/outputs:
  ```xml
  <inVariables>
    <int>0</int>  <!-- ScenarioTensor ID -->
    <int>2</int>  <!-- SelectedScenario ID -->
    <int>4</int>  <!-- ScenarioOffset ID -->
  </inVariables>
  <outVariables>
    <int>14</int> <!-- InnovationRateMicro ID -->
    <int>27</int> <!-- ImitationRateMicro ID -->
    <!-- ... one for each parameter ... -->
  </outVariables>
  ```

### Port Ordering

Port ordering is critical for correct wiring:

**Gather Operations:**
- Port 0: Output
- Port 1: Data Input
- Port 2: Index Input

**Flow Variables:**
- Port 0: Output
- Port 1: Input

**Parameter Variables:**
- Port 0: Output

### Variable Types

- **Parameter Variables**: Used for inputs (SelectedScenario, idx_*)
- **Flow Variables**: Used for outputs (ParamName) - have both input and output ports
- **Constant Variables**: Not used in current implementation

### Error Handling

- **Tensor Not Found**: Clear error message, user can correct name
- **Structure Detection Failure**: Error message with details
- **XML Generation**: No errors expected (deterministic process)
- **File Operations**: IPC handlers handle errors gracefully
- **Group Loading**: Minsky handles XML validation and loading errors

## Future Enhancements

Potential improvements:

1. **Custom Positioning**: Allow user to specify group position
2. **Variable Type Selection**: Choose between flow/parameter for outputs
3. **Batch Operations**: Wire multiple tensors at once
4. **Validation**: Pre-validate tensor structure before generation
5. **Undo Support**: Track created items for easy removal
6. **Template Customization**: Allow customization of layout and spacing

## Related Documentation

- [Scenario Loader Architecture](../scenario-loader/docs/ARCHITECTURE.md) - Tensor structure and scenario concepts
- [Minsky XML Schema](https://github.com/highdimensional/minsky) - Official Minsky documentation
- [Modding System Documentation](../../minsky-aug/modding/docs/) - IPC handler registration
