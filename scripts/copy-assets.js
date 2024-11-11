import fs from 'fs-extra';  
import path from 'path';
import { fileURLToPath } from 'url';

import { cfg } from '../src/webui.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'node_modules', 'legitsl-web-core', 'dist', 'prod');
const destDir = path.join(__dirname, '..', 'static', 'legitsl');

async function copyAssets() {
  try {
    const files = await fs.readdir(srcDir);
    const assetFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.wasm') || file.endsWith('.html'));

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