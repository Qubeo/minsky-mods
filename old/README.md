# Minsky Mods Directory

This directory contains custom mods/plugins for Minsky.

## Structure

Each mod is an Nx library in its own subdirectory:

```
libs/mods/
├── README.md (this file)
├── mod-example/          ← Example mod
├── mod-analytics/        ← Your analytics mod
├── mod-custom-export/    ← Your export mod
└── ...
```

## Creating a New Mod

### Quick Start

```bash
cd gui-js

# Generate new mod library
npx nx generate @nx/js:library mod-my-feature --directory=libs/mods/mod-my-feature

# Add path alias to tsconfig.base.json
# Add: "@minsky/mod-my-feature": ["libs/mods/mod-my-feature/src/index.ts"]
```

### Directory Structure for a Mod

```
libs/mods/mod-my-feature/
├── src/
│   ├── index.ts              ← Main export (what others import)
│   └── lib/
│       ├── my-feature.service.ts      ← Services
│       ├── my-feature.component.ts    ← Components
│       └── config.ts                  ← Configuration
├── README.md                 ← Mod documentation
├── BASE_CHANGES.md           ← Documents changes to base code
├── CHANGELOG.md              ← Version history
├── project.json              ← Nx project config
└── tsconfig.json             ← TypeScript config
```

## Mod Types

### 1. Service Mods
Add new functionality via injectable services:
- Analytics tracking
- Data processing
- External integrations
- Custom calculations

### 2. Component Mods
Add new UI components:
- Custom widgets
- New visualization types
- Tool panels
- Dialog extensions

### 3. Feature Mods
Complete feature additions:
- Export formats
- Import handlers
- Reporting tools
- Automation scripts

## Best Practices

1. **Self-Contained**: Each mod should be as independent as possible
2. **Documented**: Include README.md and BASE_CHANGES.md
3. **Versioned**: Use semantic versioning (CHANGELOG.md)
4. **Tested**: Write tests for your mod
5. **Git Branches**: Use `mod/feature-name` branch pattern

## Branch Workflow

```bash
# Create mod branch
git checkout dev
git checkout -b mod/my-feature

# Work on your mod...
# When done, merge to dev
git checkout dev
git merge mod/my-feature

# Tag the mod version
git tag mod-my-feature-v1.0.0
```

## Distribution

See `PLUGIN_SYSTEM_DESIGN.md` in the root directory for information on packaging mods as standalone plugins.

## Examples

Check the `mod-example` directory for a complete example mod showing:
- Service injection
- Component creation
- Backend integration
- Event handling

---

For detailed guides, see:
- `/MODDING_GUIDE.md` - Complete modding workflow
- `/PLUGIN_SYSTEM_DESIGN.md` - Runtime plugin system

**Happy modding!**
