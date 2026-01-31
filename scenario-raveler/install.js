const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    console.error("Error: Could not find gui-js directory. Ensure you are running this from within the Minsky repo.");
    process.exit(1);
}
console.log(`Repository root found at: ${guiJsRoot}`);

const MOD_NAME = 'mod-scenario-loader';
const MOD_SRC = __dirname;
const PATCHES_DIR = path.join(MOD_SRC, 'patches');
const LIBS_MODS_DIR = path.join(guiJsRoot, 'libs/mods');
const MOD_DEST_DIR = path.join(LIBS_MODS_DIR, MOD_NAME);
const MANIFEST_PATH = path.join(MOD_SRC, 'manifest.json');

// 2. Load Manifest
if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Error: manifest.json not found.");
    process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
console.log(`Loaded Manifest for ${manifest.id} v${manifest.version}`);

// Helper: Calculate Checksum
function calculateChecksum(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

// 3. Verify Checksums & Idempotency
console.log("Verifying core file checksums...");
let checksumsMatch = true;
let alreadyInstalledCount = 0;
const totalFiles = Object.keys(manifest.checksums).length;

for (const [relPath, expectedCleanSum] of Object.entries(manifest.checksums)) {
    const targetPath = path.join(guiJsRoot, relPath);
    const actualSum = calculateChecksum(targetPath);

    if (!actualSum) {
        console.error(`MISSING: ${relPath}`);
        checksumsMatch = false;
    } else if (actualSum !== expectedCleanSum) {
        checksumsMatch = false; // Provisional
    } else {
        console.log(`OK (Clean): ${relPath}`);
    }
}

// Prepare Mappings
const fileMappings = [
    { src: 'tsconfig.base.json', dest: 'tsconfig.base.json' },
    { src: 'simulation.module.ts', dest: 'libs/menu/src/lib/simulation/simulation.module.ts' },
    { src: 'simulation-routing.module.ts', dest: 'libs/menu/src/lib/simulation/simulation-routing.module.ts' },
    { src: 'ApplicationMenuManager.ts', dest: 'apps/minsky-electron/src/app/managers/ApplicationMenuManager.ts' },
    { src: 'electron.service.ts', dest: 'libs/core/src/lib/services/electron/electron.service.ts' },
    { src: 'electron.events.ts', dest: 'apps/minsky-electron/src/app/events/electron.events.ts' }
];

// Re-evaluate Mismatches with "Already Patched" check
if (!checksumsMatch) {
    console.log("Some files did not match clean state. Checking if already patched...");
    checksumsMatch = true; // reset to optimistic

    for (const mapping of fileMappings) {
        const targetPath = path.join(guiJsRoot, mapping.dest);
        const patchPath = path.join(PATCHES_DIR, mapping.src);
        const targetSum = calculateChecksum(targetPath);
        const patchSum = calculateChecksum(patchPath);
        const cleanSum = manifest.checksums[mapping.dest];

        if (targetSum === cleanSum) {
            // matches clean, ok
        } else if (targetSum === patchSum) {
            console.log(`OK (Already Patched): ${mapping.dest}`);
            alreadyInstalledCount++;
        } else {
            console.error(`CHECKSUM MISMATCH: ${mapping.dest}`);
            console.error(`  Expected Clean:   ${cleanSum}`);
            console.error(`  Expected Patched: ${patchSum}`);
            console.error(`  Actual:           ${targetSum}`);
            checksumsMatch = false;
        }
    }
}

if (!checksumsMatch) {
    console.error("\n[ERROR] Core file checksums do not match manifest or patch.");
    console.error("Installation aborted. Run 'restore_core.sh' to reset.");
    process.exit(1);
}

if (alreadyInstalledCount === totalFiles) {
    // Determine if we should proceed to update mod files anyway (e.g. source code update)
    // The user wants "Every update done through install.js".
    // So even if core patches are done, we should update the mod source.
    console.log("\nCore files are already patched.");
}

// 4. Ensure libs/mods exists
if (!fs.existsSync(LIBS_MODS_DIR)) {
    fs.mkdirSync(LIBS_MODS_DIR, { recursive: true });
}

// 5. Copy Mod Source (No Symlink)
console.log(`Copying mod source to ${MOD_DEST_DIR}...`);

// Remove existing dest if it's a symlink or dir, to ensure clean copy
if (fs.existsSync(MOD_DEST_DIR)) {
    const stat = fs.lstatSync(MOD_DEST_DIR);
    if (stat.isSymbolicLink()) {
        console.log("Removing existing symlink...");
        fs.unlinkSync(MOD_DEST_DIR);
    } else {
        // We generally shouldn't delete the dir unless we are sure.
        // But for "install", overwriting is expected.
        // fs.rmSync(MOD_DEST_DIR, { recursive: true, force: true }); 
        // Let's use cpSync with force, but maybe safer to clean first?
        // User said: "Should not work with symlinks."
        // Let's just overwrite.
    }
}

// Recursive Copy Function (exclusions: patches, install.js, etc)
function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });
    const excludes = ['.git', 'node_modules', 'patches', 'install.js', 'uninstall.js', 'manifest.json', 'libs', 'docs'];

    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // skip hidden files
        if (excludes.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(MOD_SRC, MOD_DEST_DIR);
console.log("Mod source copied.");


// 6. File Replacements
function backupAndCopy(mapping) {
    const srcPath = path.join(PATCHES_DIR, mapping.src);
    const destPath = path.join(guiJsRoot, mapping.dest);
    const backupPath = destPath + '.bak';

    // Check if already patched
    const destSum = calculateChecksum(destPath);
    const srcSum = calculateChecksum(srcPath);
    if (destSum === srcSum) {
        return;
    }

    if (!fs.existsSync(srcPath)) {
        console.error(`Patch file missing: ${srcPath}`);
        return;
    }

    if (fs.existsSync(destPath)) {
        if (!fs.existsSync(backupPath)) {
            console.log(`Backing up ${path.basename(destPath)}...`);
            fs.copyFileSync(destPath, backupPath);
        }
    }
    console.log(`Patching ${path.basename(destPath)}...`);
    fs.copyFileSync(srcPath, destPath);
}

if (alreadyInstalledCount < totalFiles) {
    console.log("\nApplying file patches...");
    fileMappings.forEach(backupAndCopy);
}

console.log("\nInstallation complete! Please run 'npm start' or rebuild.");
