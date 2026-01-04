# Base Code Changes for mod-example

This mod requires the following minimal changes to the base Minsky code.

## Files Modified

### `/gui-js/tsconfig.base.json`

**Add path mapping:**

```json
{
  "compilerOptions": {
    "paths": {
      "@minsky/core": ["libs/core/src/index.ts"],
      "@minsky/shared": ["libs/shared/src/index.ts"],
      "@minsky/ui-components": ["libs/ui-components/src/index.ts"],
      "@minsky/menu": ["libs/menu/src/index.ts"],
      "@minsky/mod-example": ["libs/mods/mod-example/src/index.ts"]  // ← ADD THIS
    }
  }
}
```

**Rationale:** Allows importing the mod using `@minsky/mod-example` alias.

---

### `/gui-js/apps/minsky-web/src/app/app.component.ts` (Optional)

If you want to use the example component in the main app:

**Add import:**
```typescript
import { ExampleComponent } from '@minsky/mod-example';
```

**Add to component imports:**
```typescript
@Component({
  imports: [
    // ... existing imports
    ExampleComponent  // ← ADD THIS
  ]
})
```

**Add to template:**
```html
<minsky-example></minsky-example>
```

**Rationale:** Makes the example component visible in the app.

---

### `/gui-js/apps/minsky-web/src/app/app-routing.module.ts` (Optional)

If you want the example as a route:

**Add route:**
```typescript
{
  path: 'example',
  component: ExampleComponent
}
```

**Rationale:** Allows navigating to `/example` to see the component.

---

## Testing Without Base Changes

You can also test the mod without modifying base code:

```typescript
// In any component
import { ExampleService } from '@minsky/mod-example';

constructor(private example: ExampleService) {
  this.example.greet('Test');
}
```

The service is provided at root level, so it will be automatically available.

---

## Reverting Changes

To disable this mod:
1. Remove the path mapping from `tsconfig.base.json`
2. Remove any imports of `@minsky/mod-example`
3. Remove the component from templates/routes

---

**Last Updated:** 2026-01-04
**Mod Version:** 1.0.0
