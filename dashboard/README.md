# Minsky Dashboard - Web Service

A standalone web dashboard for visualizing and interacting with Minsky economic models through a modern web interface.

## Overview

The Minsky Dashboard provides a browser-based interface to:
- Load and run Minsky economic models (.mky files)
- Visualize time series data with interactive charts
- Monitor variable values in real-time
- Control simulation parameters (step, run, reset)

**Architecture**: Bun API server (native C++ addon) + SvelteKit frontend + TradingView Lightweight Charts

## Quick Start

### Prerequisites
- Bun runtime installed
- Minsky installed with native addon built at `minsky/gui-js/build/minskyRESTService.node`

### Running the Dashboard

**Terminal 1 - API Server:**
```bash
cd mods/dashboard/api
bun index.ts
```
Server runs on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd mods/dashboard/web
bun run dev
```
Frontend runs on http://localhost:5173

**Open your browser** to http://localhost:5173

## Project Structure

```
dashboard/
├── api/                          # Bun API server
│   ├── index.ts                 # REST endpoints with Bun.serve()
│   ├── minsky-bridge.ts         # Native addon wrapper
│   ├── types.ts                 # Shared TypeScript types
│   └── package.json
│
├── web/                          # SvelteKit frontend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte     # Main dashboard UI
│   │   │   └── +layout.svelte   # App layout
│   │   └── lib/
│   │       ├── api.ts           # API client
│   │       ├── stores.ts        # Svelte stores (state)
│   │       └── components/
│   │           └── TimeSeriesChart.svelte  # Chart component
│   ├── package.json
│   └── svelte.config.js
│
├── docs/
│   └── minsky-api-reference.md  # Native addon API guide
│
└── package.json                  # Workspace root
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/version` | GET | Get Minsky version |
| `/api/state` | GET | Get simulation state (t, stepMin, stepMax, nSteps) |
| `/api/variables` | GET | Get all variables with current values |
| `/api/model/load` | POST | Load .mky model file |
| `/api/sim/reset` | POST | Reset simulation to t=0 |
| `/api/sim/step` | POST | Execute single simulation step |
| `/api/sim/run` | POST | Run N steps and return history |

### Example API Usage

```bash
# Get version
curl http://localhost:3000/api/version

# Load model
curl -X POST http://localhost:3000/api/model/load \
  -H "Content-Type: application/json" \
  -d '{"path":"/path/to/model.mky"}'

# Run 100 steps
curl -X POST http://localhost:3000/api/sim/run \
  -H "Content-Type: application/json" \
  -d '{"steps":100,"variables":[":Y",":K",":L"]}'
```

## Features

### Current Features
- **Model Loading**: Load any .mky model file from the filesystem
- **Variable Display**: View all model variables with their current values and types (flow, stock, parameter, constant)
- **Simulation Controls**: Step-by-step or bulk simulation runs
- **Time Series Visualization**: Interactive charts using TradingView Lightweight Charts v5
- **Real-time Updates**: Variable values update after each simulation step
- **Variable Selection**: Choose which variables to plot on the chart

### Variable Types
- **Flow**: Regular flow variables (e.g., `:Investment`, `:Y`)
- **Stock**: Stock/accumulation variables (e.g., `stock:K`)
- **Parameter**: Model parameters (e.g., `parameter:alpha`)
- **Constant**: Fixed constants (e.g., `constant:one`)

## Development

### Adding New Features

**API Layer** (`api/minsky-bridge.ts`):
- Add new methods to the `minsky` object
- Use `callSync()` to invoke C++ backend commands
- See `docs/minsky-api-reference.md` for available commands

**Frontend** (`web/src/routes/+page.svelte`):
- UI components are in standard Svelte 5 format
- State management via Svelte stores (`$lib/stores.ts`)
- Charts use Lightweight Charts v5 API

### Building for Production

```bash
# Build frontend
cd web
bun run build

# The built app will be in web/.svelte-kit/output
# Serve with: node web/.svelte-kit/output/server/index.js
```

## Troubleshooting

### API Server Won't Start
- **Port in use**: Another process is using port 3000. Kill it or change the port in `api/index.ts`
- **Native addon not found**: Ensure Minsky is built and `minsky/gui-js/build/minskyRESTService.node` exists
- **Permission denied**: Check file permissions on the addon

### Chart Not Displaying
- Open browser console (F12) to check for errors
- Verify API is returning data: Check Network tab for `/api/sim/run` response
- Ensure variables are selected (checkboxes in Variables panel)

### Variables Show as Numbers
- This was fixed in v1.0. Update to latest version
- The API now filters out internal wiring variables (numeric prefixes like `993733488:0`)

## Technical Details

### Native Addon Communication
- Uses **synchronous** API (`command.$sync`) for fast, blocking calls (~0.3ms)
- Async API available but requires callback setup
- Single-threaded: Only one simulation can run at a time

### Chart Library (Lightweight Charts v5)
- **Breaking change from v4**: Use `chart.addSeries(LineSeries, options)` instead of `chart.addLineSeries(options)`
- Time values: Uses `Math.round(t * 1000)` for millisecond precision
- Color palette: 10 distinct colors, cycles for >10 variables

### Performance
- API response time: <1ms for sync calls
- Typical 100-step simulation: ~30-100ms depending on model complexity
- Chart rendering: Hardware accelerated via Canvas

## Known Limitations

- **Single user**: No authentication or multi-user support
- **Local files only**: Models must be on server filesystem (no upload yet)
- **No persistence**: State lost on server restart
- **Blocking simulation**: Long simulations block API thread

## Future Enhancements

Planned features:
- [ ] WebSocket support for real-time streaming
- [ ] File upload for .mky models
- [ ] Multiple chart types (area, histogram, scatter)
- [ ] Export data as CSV
- [ ] Save/load scenarios
- [ ] Parameter adjustment sliders
- [ ] Multi-session support

## License

Part of the Minsky project. See main Minsky repository for license details.

## References

- [Lightweight Charts v5 API](https://tradingview.github.io/lightweight-charts/docs/api)
- [Lightweight Charts Migration Guide](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5)
- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [Bun Runtime](https://bun.sh)
