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

For each parameter, the system creates:

1. **Index Variable** (`idx_ParamName`) - Constant value representing the column index
2. **First Gather Operation** (axis: `name`) - Extracts the row from the tensor
3. **Second Gather Operation** (axis: `attribute`) - Extracts the column from the row
4. **Output Variable** (`ParamName`) - Flow variable that receives the final value

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

### Wiring Connections

For each parameter row:

```
Tensor (output) → Gather Name (data input)
Index Constant (output) → Gather Name (index input)
Gather Name (output) → Gather Attribute (data input)
SelectedScenario (output) → Gather Attribute (index input)
Gather Attribute (output) → Output Variable (input)
```

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

#### `generateMinskyXML(tensorName, paramNames, scenarioNames): string`

Main method that generates the complete Minsky XML document.

**Parameters:**
- `tensorName: string` - Name of the tensor variable (without colon prefix)
- `paramNames: string[]` - Array of parameter names (column names)
- `scenarioNames: string[]` - Array of scenario/attribute names (row names, used for count/description)

**Returns:**
Complete XML string in Minsky .mky format

**Process:**
1. Resets internal state (idCounter, wires, items)
2. Creates input variables:
   - Tensor variable (`:${tensorName}`) - positioned at center-left
   - SelectedScenario variable (`:SelectedScenario`) - positioned above, with tooltip showing scenario range
3. For each parameter:
   - Creates index variable (`:idx_${paramName}`) with initial value = index
   - Creates first gather operation (axis: `name`) at x+400
   - Creates second gather operation (axis: `attribute`) at x+600
   - Creates output flow variable (`:${paramName}`) at x+800
   - Creates all 5 wire connections
4. Constructs final XML with proper structure:
   ```xml
   <?xml version="1.0"?>
   <Minsky xmlns="http://minsky.sf.net/minsky">
     <schemaVersion>3</schemaVersion>
     <wires>...</wires>
     <items>...</items>
     <groups></groups>
   </Minsky>
   ```

**Layout:**
- `startX = 0`, `startY = 0`
- Vertical spacing: `spacingY = 80` pixels between rows
- Tensor variable centered vertically
- SelectedScenario positioned 100 pixels above startY

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
- `axis: 'name'|'attribute'` - Gather axis type

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
- `axis` (`name` or `attribute`)

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
    paramNames: string[];      // Column names (xvectors[0].slices)
    scenarioNames: string[];    // Row names (xvectors[1].slices)
    numParams: number;         // Count of parameters
    numScenarios: number;       // Count of scenarios
}
```

**Process:**
1. Gets VariableValue for tensor name
2. Accesses `hypercube()` method
3. Extracts `xvectors[0].slices` as parameter names (columns)
4. Extracts `xvectors[1].slices` as scenario names (rows)
5. Validates that both arrays have length > 0
6. Returns metadata object

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

### Step 1: Prepare Tensor Variable

1. Import CSV data or manually create a tensor variable
2. Ensure the tensor has:
   - Column names (parameter names) in `xvectors[0].slices`
   - Row names (scenario/attribute names) in `xvectors[1].slices`

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

The system creates:

- **Input Variables:**
  - `:SelectedScenario` - Parameter for selecting scenario index (0 to N-1)
  - `:{tensorName}` - Reference to the original tensor

- **For Each Parameter:**
  - `:idx_{ParamName}` - Index constant (column index in tensor)
  - Two gather operations (name axis, attribute axis)
  - `:{ParamName}` - Flow variable (output with input port)

- **Wiring:**
  - Complete wiring diagram connecting all elements
  - All items grouped together for easy positioning

### Step 6: Use the Infrastructure

1. The generated group appears on the canvas
2. Set `SelectedScenario` to the desired scenario index (0, 1, 2, ...)
3. Each parameter variable (`ParamName`) will contain the value for that scenario
4. Connect parameter variables to other parts of your model as needed

## Technical Details

### XML Format Compliance

The generated XML follows Minsky's schema version 3 format:

- Proper namespace: `http://minsky.sf.net/minsky`
- Schema version: `3`
- All required fields for items (id, type, x, y, zoomFactor, rotation, width, height)
- Proper port structure for each item type
- XML escaping for names and values

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
