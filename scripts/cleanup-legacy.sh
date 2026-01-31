#!/bin/bash
# Cleanup legacy files from old modding system

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🧹 Cleaning up legacy files from minsky-mods..."
echo "Working directory: $REPO_ROOT"
echo ""

# Dry run by default
DRY_RUN=true
if [[ "$1" == "--apply" ]]; then
    DRY_RUN=false
    echo "⚠️  APPLY mode - changes will be made!"
else
    echo "ℹ️  DRY RUN mode - no changes will be made"
    echo "   Run with --apply to actually delete files"
fi
echo ""

# Function to remove or preview removal
remove_item() {
    local item="$1"
    if [ -e "$item" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo "  [DRY RUN] Would remove: $item"
        else
            echo "  Removing: $item"
            rm -rf "$item"
        fi
    fi
}

# 1. Remove patches/ directories
echo "1️⃣  Removing legacy patches/ directories..."
for mod in scenario-grower scenario-raveler scenario-loader; do
    if [ -d "$mod/patches" ]; then
        remove_item "$mod/patches"
    fi
done
echo ""

# 2. Remove .claude/ directories (personal settings)
echo "2️⃣  Removing .claude/ directories (personal settings)..."
for mod in scenario-grower scenario-raveler scenario-loader; do
    if [ -d "$mod/.claude" ]; then
        remove_item "$mod/.claude"
    fi
done
echo ""

# 3. Check for .gitignore
echo "3️⃣  Checking for .gitignore..."
if [ ! -f ".gitignore" ]; then
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would create .gitignore"
    else
        echo "  Creating .gitignore..."
        cat > .gitignore << 'EOF'
# Node modules (if not symlinked)
node_modules/

# Personal Claude settings
.claude/

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Build artifacts
dist/
*.log

# Temporary files
*.bak
*.old
*.orig
EOF
    fi
else
    echo "  .gitignore already exists"
    if ! grep -q ".claude/" .gitignore; then
        echo "  ⚠️  .claude/ not in .gitignore - add it!"
    fi
fi
echo ""

# 4. Report on missing files
echo "4️⃣  Checking for missing required files..."
for mod in csv-export llm-assist scenario-loader; do
    missing=()
    [ ! -f "$mod/package.json" ] && missing+=("package.json")
    [ ! -f "$mod/tsconfig.json" ] && missing+=("tsconfig.json")

    if [ ${#missing[@]} -gt 0 ]; then
        echo "  ⚠️  $mod missing: ${missing[*]}"
        echo "     → Use scenario-grower as template to create these"
    fi
done
echo ""

# 5. Check for outdated README patterns
echo "5️⃣  Checking for outdated README patterns..."
for mod in scenario-grower scenario-raveler scenario-loader csv-export llm-assist; do
    if [ -f "$mod/README.md" ]; then
        if grep -q "install\.js\|uninstall\.js\|\.bak" "$mod/README.md" 2>/dev/null; then
            echo "  ⚠️  $mod/README.md mentions old install system"
            echo "     → Update to reference: modding/tools/install-mod.js"
        fi
    fi
done
echo ""

# Summary
echo "✅ Cleanup check complete!"
echo ""
if [ "$DRY_RUN" = true ]; then
    echo "To apply changes, run:"
    echo "  bash scripts/cleanup-legacy.sh --apply"
else
    echo "Changes have been applied!"
    echo ""
    echo "Next steps:"
    echo "1. Create missing package.json/tsconfig.json files"
    echo "2. Update outdated README.md files"
    echo "3. Review changes with: git status"
fi
