const fs = require('fs');
const path = require('path');

// 1. Locate gui-js root (Robust sibling search)
let currentDir = process.cwd();
let guiJsRoot = null;

while (currentDir !== path.parse(currentDir).root) {
    const potentialGuiJs = path.join(currentDir, 'gui-js');
    if (fs.existsSync(path.join(potentialGuiJs, 'tsconfig.base.json'))) {
        guiJsRoot = potentialGuiJs;
        break;
    }
    currentDir = path.dirname(currentDir);
}

if (!guiJsRoot) {
    console.error("Error: Could not find gui-js directory.");
    process.exit(1);
}
console.log(`Repository root found at: ${guiJsRoot}`);

const filesToRestore = [
    'tsconfig.base.json',
    'libs/menu/src/lib/simulation/simulation.module.ts',
    'libs/menu/src/lib/simulation/simulation-routing.module.ts',
    'apps/minsky-electron/src/app/managers/ApplicationMenuManager.ts',
    'libs/shared/src/lib/constants/constants.ts', // Included for legacy cleanup
    'libs/core/src/lib/services/electron/electron.service.ts',
    'apps/minsky-electron/src/app/events/electron.events.ts'
];

console.log("Restoring backups...");

filesToRestore.forEach(file => {
    const filePath = path.join(guiJsRoot, file);
    const backupPath = filePath + '.bak';

    if (fs.existsSync(backupPath)) {
        console.log(`Restoring ${path.basename(filePath)}...`);
        fs.copyFileSync(backupPath, filePath);
        fs.unlinkSync(backupPath);
    }
});

const MOD_NAME = 'mod-scenario-loader';
const LIBS_MODS_DIR = path.join(guiJsRoot, 'libs/mods');
const MOD_DEST_DIR = path.join(LIBS_MODS_DIR, MOD_NAME);

if (fs.existsSync(MOD_DEST_DIR)) {
    console.log(`Removing mod directory: ${MOD_DEST_DIR}...`);
    fs.rmSync(MOD_DEST_DIR, { recursive: true, force: true });
}

console.log("Uninstallation complete.");
