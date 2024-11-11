import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localWebCorePath = path.join(__dirname, '..', '..', 'legitsl-web-core');

try {
  // Check if the local path exists
  if (fs.existsSync(localWebCorePath)) {
    console.log('Installing local version of WebCore...');
    execSync(`npm install --no-save file:${localWebCorePath}`, { stdio: 'inherit' });
  } else {
    console.log('Local WebCore not found. Skipping local install.');
  }
} catch (error) {
  console.error('Error during local WebCore installation:', error.message);
}