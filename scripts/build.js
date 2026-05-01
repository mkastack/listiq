import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Pre-create the server entry point
const serverDir = path.resolve(process.cwd(), 'dist/server');
console.log('[@listiq] Ensuring server directory exists:', serverDir);
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}
const serverEntry = path.join(serverDir, 'index.js');
console.log('[@listiq] Creating dummy server entry:', serverEntry);
fs.writeFileSync(serverEntry, 'export default { fetch: () => {} };');

// 2. Run the actual build
console.log('[@listiq] Starting vite build...');
const result = spawnSync('npx', ['vite', 'build'], { 
  stdio: 'inherit',
  shell: true 
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log('[@listiq] Build completed successfully');
