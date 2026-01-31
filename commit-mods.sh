#!/bin/bash
# Commit the mods updates

cd /home/qubeo/prog/minsky-mods

echo "Adding mods updates..."

# New documentation
git add README.md CLAUDE.md CLEANUP.md
git add old/README.md

# Scenario-grower updates
git add scenario-grower/package.json
git add scenario-grower/tsconfig.json
git add scenario-grower/manifest.json
git add scenario-grower/src/index.ts

# CSV export optimization
git add csv-export/src/lib/csv-export.service.ts

# Architecture doc (if exists)
[ -f scenario-loader/docs/ARCHITECTURE.md ] && git add scenario-loader/docs/ARCHITECTURE.md

echo ""
echo "Files staged. Review with: git status"
echo ""
echo "To commit:"
echo '  git commit -m "docs: Add documentation and clean up outdated files

- Add README with installation and mod creation guide
- Add CLAUDE.md with DevOps-style quick reference
- Add CLEANUP.md with cleanup recommendations
- Remove outdated BASE_CHANGES.md and planning docs
- Remove duplicate ARCHITECTURE.md files
- Archive old design docs
- Add package.json and tsconfig.json for scenario-grower
- Update manifest.json with file paths for routes
- Optimize csv-export service (remove unnecessary filtering)"'
