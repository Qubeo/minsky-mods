# Example Mod

This is a minimal example mod demonstrating the basic patterns for creating Minsky mods.

## What This Mod Does

- Adds a simple greeting service
- Demonstrates dependency injection
- Shows how to access the ElectronService and backend
- Provides a basic component example

## Installation

### 1. Add to tsconfig.base.json

```json
{
  "compilerOptions": {
    "paths": {
      "@minsky/mod-example": ["libs/mods/mod-example/src/index.ts"]
    }
  }
}
```

### 2. Use in Your App

```typescript
// In app.component.ts or any component
import { ExampleService } from '@minsky/mod-example';

export class AppComponent {
  constructor(private example: ExampleService) {
    this.example.greet('World');
  }
}
```

## Files

- `src/index.ts` - Public exports
- `src/lib/example.service.ts` - Injectable service
- `src/lib/example.component.ts` - Standalone component
- `BASE_CHANGES.md` - Documents required changes to base code

## Base Code Changes

See `BASE_CHANGES.md` for details on what needs to be modified in the base Minsky code to use this mod.

## Version

1.0.0 - Initial example

## Author

Claude - AI Assistant
