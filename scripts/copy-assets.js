import fs from 'fs-extra';  
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import { cfg } from '../src/webui.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'node_modules', 'legitsl-web-core', 'dist', 'prod');
const destDir = path.join(__dirname, '..', 'static', 'legitsl');

// GH is screwing this up, so try to install it manually if it ain't there
if (!fs.existsSync(srcDir)) {
  console.log(`"${srcDir}" not found. Installing dependency from package.json...`);
  try {
    execSync('npm install legitsl-web-core', { stdio: 'inherit' });
    console.log('Dependency installed successfully.');
  } catch (error) {
    console.error('Failed to install dependency:', error);
    process.exit(1); 
  }
} else {
  console.log(`"${srcDir}" found. Proceeding with postinstall tasks.`);
}

async function copyAssets() {
  try {
    const files = await fs.readdir(srcDir);
    const assetFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.wasm'));

    await Promise.all(assetFiles.map(async (file) => {
      await fs.copyFile(path.join(srcDir, file), path.join(destDir, file));
    }));

    console.log(`Assets copied successfully from: \n    ${srcDir} \nto:\n    ${destDir}`);
  } catch (err) {
    // console.error('Error copying assets:', err);
    console.log('Local core assets not found or inaccessible.');
  }
}
copyAssets();