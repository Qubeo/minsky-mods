#!/bin/bash
# Create a new Minsky mod with proper structure

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <mod-name> [description]"
    echo ""
    echo "Example: $0 my-new-mod 'Brief description of the mod'"
    exit 1
fi

MOD_NAME="$1"
MOD_DESCRIPTION="${2:-A new Minsky mod}"
MOD_TITLE=$(echo "$MOD_NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
MOD_PASCAL=$(echo "$MOD_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')

cd "$REPO_ROOT"

if [ -d "$MOD_NAME" ]; then
    echo "❌ Error: Directory $MOD_NAME already exists!"
    exit 1
fi

echo "🚀 Creating new mod: $MOD_NAME"
echo "   Title: $MOD_TITLE"
echo "   Description: $MOD_DESCRIPTION"
echo ""

# Create directory structure
mkdir -p "$MOD_NAME/src/lib"
mkdir -p "$MOD_NAME/docs"

# Create package.json
cat > "$MOD_NAME/package.json" << EOF
{
  "name": "@minsky/$MOD_NAME",
  "version": "1.0.0",
  "description": "$MOD_DESCRIPTION",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./src/lib/*": "./src/lib/*.ts",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "@angular/core": ">=17.0.0",
    "@angular/common": ">=17.0.0",
    "@angular/router": ">=17.0.0"
  }
}
EOF

# Create manifest.json
cat > "$MOD_NAME/manifest.json" << EOF
{
  "id": "$MOD_NAME",
  "name": "$MOD_TITLE",
  "version": "1.0.0",
  "contributes": {
    "menus": {
      "items": [
        {
          "menu": "simulation",
          "label": "$MOD_TITLE...",
          "command": "$MOD_NAME.open"
        }
      ]
    },
    "commands": [
      {
        "id": "$MOD_NAME.open",
        "route": "$MOD_NAME",
        "window": {
          "width": 800,
          "height": 600,
          "title": "$MOD_TITLE"
        }
      }
    ],
    "routes": [
      {
        "path": "$MOD_NAME",
        "module": "${MOD_PASCAL}Module",
        "file": "src/lib/$MOD_NAME.module"
      }
    ],
    "ipc": []
  }
}
EOF

# Create tsconfig.json
cat > "$MOD_NAME/tsconfig.json" << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create Angular module
cat > "$MOD_NAME/src/lib/$MOD_NAME.module.ts" << EOF
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ${MOD_PASCAL}Component } from './$MOD_NAME.component';

const routes: Routes = [
  { path: '', component: ${MOD_PASCAL}Component }
];

@NgModule({
  declarations: [${MOD_PASCAL}Component],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ${MOD_PASCAL}Module {}
EOF

# Create component
cat > "$MOD_NAME/src/lib/$MOD_NAME.component.ts" << EOF
import { Component } from '@angular/core';

@Component({
  selector: 'minsky-$MOD_NAME',
  templateUrl: './$MOD_NAME.component.html',
  styleUrls: ['./$MOD_NAME.component.scss']
})
export class ${MOD_PASCAL}Component {
  constructor() {}

  // Add your component logic here
}
EOF

# Create template
cat > "$MOD_NAME/src/lib/$MOD_NAME.component.html" << EOF
<div class="mod-container">
  <h1>$MOD_TITLE</h1>
  <p>Welcome to the $MOD_TITLE mod!</p>

  <!-- Add your UI here -->
</div>
EOF

# Create styles
cat > "$MOD_NAME/src/lib/$MOD_NAME.component.scss" << EOF
.mod-container {
  padding: 20px;

  h1 {
    margin-bottom: 16px;
  }
}
EOF

# Create barrel export
cat > "$MOD_NAME/src/index.ts" << EOF
// Export Angular modules and components
export { ${MOD_PASCAL}Module } from './lib/$MOD_NAME.module';
export { ${MOD_PASCAL}Component } from './lib/$MOD_NAME.component';

// DO NOT export ipc-handlers here!
// They contain Node.js modules and will break browser bundle
EOF

# Create README
cat > "$MOD_NAME/README.md" << EOF
# $MOD_TITLE

$MOD_DESCRIPTION

## Installation

Install this mod into Minsky:

\`\`\`bash
cd /path/to/minsky/modding/tools
bun install-mod.js /path/to/minsky-mods/$MOD_NAME
\`\`\`

Then rebuild/restart Minsky:

\`\`\`bash
cd /path/to/minsky/gui-js
bun start
\`\`\`

## Usage

1. Open Minsky
2. Go to **Simulation → $MOD_TITLE...**
3. Use the mod

## Features

- Feature 1
- Feature 2

## Development

After making changes, reinstall:

\`\`\`bash
cd /path/to/minsky/modding/tools
bun install-mod.js /path/to/minsky-mods/$MOD_NAME
\`\`\`

Then restart Minsky to see your changes.
EOF

echo "✅ Mod created successfully!"
echo ""
echo "📁 Directory structure:"
tree -L 2 -I 'node_modules' "$MOD_NAME" 2>/dev/null || find "$MOD_NAME" -type f | sort
echo ""
echo "📋 Next steps:"
echo "   1. Edit $MOD_NAME/src/lib/$MOD_NAME.component.ts"
echo "   2. Add your UI to $MOD_NAME/src/lib/$MOD_NAME.component.html"
echo "   3. Install into Minsky:"
echo "      cd /path/to/minsky/modding/tools"
echo "      bun install-mod.js $REPO_ROOT/$MOD_NAME"
echo ""
echo "📖 See docs/MOD_CREATION_WORKFLOW.md for full documentation"
