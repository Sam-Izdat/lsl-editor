import fs from 'fs-extra';  
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import { cfg } from '../src/webui.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GH is screwing this up, so try to install it manually if it ain't there
const srcDir = path.join(__dirname, '..', 'node_modules', 'legitsl-web-core', 'dist', 'prod');
const destDir = path.join(__dirname, '..', 'static', 'legitsl');

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
  // execSync(`ls -l ${srcDir}`, { stdio: 'inherit' });
}

async function copyAssets() {
  try {
    if (!fs.existsSync(destDir)) {
      await fs.mkdir(destDir, { recursive: true });
    }

    const files = await fs.readdir(srcDir);
    console.log('Files in srcDir:', files);

    const assetFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.wasm'));
    console.log('Filtered asset files:', assetFiles);

    await Promise.all(assetFiles.map(async (file) => {
      console.log(`Copying ${file}...`);
      await fs.copyFile(path.join(srcDir, file), path.join(destDir, file));
    }));

    console.log(`Assets copied successfully from: \n    ${srcDir} \nto:\n    ${destDir}`);
  } catch (err) {
    console.log('Local core assets not found or inaccessible.', err);
  }
}

await copyAssets();