# Cleanup Recommendations

Files and directories that can be removed or consolidated.

## Safe to Remove

### Outdated Documentation (Old Approach)

These describe the old "file replacement" approach, not the current copy-to-libs/mods:

```bash
# In each mod directory
rm scenario-grower/BASE_CHANGES.md
rm scenario-raveler/BASE_CHANGES.md
rm scenario-loader/BASE_CHANGES.md
```

### Duplicate Architecture Docs

Several mods have `ARCHITECTURE.md` both in root AND in `docs/`:

```bash
# Keep docs/ version, remove root duplicate
rm scenario-grower/ARCHITECTURE.md
rm scenario-raveler/ARCHITECTURE.md
```

### Planning Documents (Archive or Remove)

These are planning docs that may be outdated:

```bash
# Move to archive or remove if no longer relevant
mv scenario-grower/SCENARIO_LOADER_PLAN.md archive/ 2>/dev/null || rm
mv scenario-raveler/SCENARIO_LOADER_PLAN.md archive/ 2>/dev/null || rm
mv scenario-raveler/RAVEL_UPGRADE_DESIGN.md archive/ 2>/dev/null || rm
mv scenario-raveler/RAVEL_NATIVE_DESIGN.md archive/ 2>/dev/null || rm
```

## Keep (Archive Section)

The `old/` directory contains experimental work - keep for reference:

```bash
# Just add a README to explain
cat > old/README.md << 'EOF'
# Archived Experiments

Historical mod experiments and design explorations:

- **mod-example**: Early modding proof of concept
- **minsky-DSL**: Domain-specific language experiments

Kept for reference only.
EOF
```

## Recommended Consolidation

### Each Mod Should Have

```
scenario-grower/
├── package.json
├── manifest.json
├── tsconfig.json        # Optional, for IDE
├── README.md            # User-facing overview
└── docs/
    ├── ARCHITECTURE.md  # Technical details
    └── *.md             # Other specific docs
```

Remove duplicates in root if they exist in docs/.

## Cleanup Script

```bash
#!/bin/bash
cd /home/qubeo/prog/minsky-mods

# Remove outdated docs
find . -maxdepth 2 -name "BASE_CHANGES.md" -delete
find . -maxdepth 2 -name "SCENARIO_LOADER_PLAN.md" -delete

# Remove root ARCHITECTURE.md if docs/ARCHITECTURE.md exists
for mod in scenario-grower scenario-raveler scenario-loader; do
    if [ -f "$mod/docs/ARCHITECTURE.md" ] && [ -f "$mod/ARCHITECTURE.md" ]; then
        echo "Removing duplicate $mod/ARCHITECTURE.md"
        rm "$mod/ARCHITECTURE.md"
    fi
done

# Create archive for old designs
for mod in scenario-grower scenario-raveler; do
    if [ -f "$mod/RAVEL_UPGRADE_DESIGN.md" ] || [ -f "$mod/RAVEL_NATIVE_DESIGN.md" ]; then
        mkdir -p "$mod/archive"
        mv "$mod/RAVEL_"*.md "$mod/archive/" 2>/dev/null || true
    fi
done

# Add README to old/
cat > old/README.md << 'EOF'
# Archived Experiments

Historical mod experiments and design explorations kept for reference.
EOF

echo "Cleanup complete!"
```

## After Cleanup

Run to verify nothing important was deleted:
```bash
git status
git diff
```
