# CSV Export Mod

A lightweight plugin to export all model variables to CSV.

## Features

- Exports variables with: name, value, init, units, description, type
- Uses efficient `keys()` + `elem()` pattern to avoid O(n*m) backend overhead
- Simple one-click export UI

## Installation

```bash
cd mods/mod-csv-export
node install.js
```

Then rebuild the frontend:
```bash
cd gui-js
npm start
```

## Usage

Navigate to **Simulation > Export CSV** in the menu to access the export panel.

## Uninstallation

```bash
cd mods/mod-csv-export
node uninstall.js
```

## Technical Notes

This mod works with the optimized backend `summarise()` method which now builds the `SystemOfEquations` once per call instead of once per variable (O(n+m) vs O(n*m)).

However, for the CSV export, we use the even more efficient `keys()` + selective `elem()` approach since:
1. We need `detailedText` which is not in the Summary struct
2. This avoids even the LaTeX/MATLAB string generation overhead
