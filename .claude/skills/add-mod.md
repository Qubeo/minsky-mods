# Add Mod Skill

Create a new Minsky mod with proper structure.

## Usage

```
/add-mod <mod-name> [description]
```

Runs `bash scripts/create-mod.sh <mod-name> [description]`

## Examples

```
/add-mod variable-inspector "Inspect and analyze model variables"
/add-mod csv-importer
```

## Creates

- package.json with `@minsky/<mod-name>`
- manifest.json with menu/route declarations
- tsconfig.json for IDE support
- Angular module, component, template, styles
- README with installation instructions

## Next Steps

```bash
cd /path/to/minsky/modding/tools
bun install-mod.js /path/to/minsky-mods/<mod-name>

cd /path/to/minsky/gui-js
bun start
```

See `docs/MOD_CREATION_WORKFLOW.md` for details.
