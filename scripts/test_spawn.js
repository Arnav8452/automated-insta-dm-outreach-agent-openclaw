const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const extPath = path.resolve(__dirname, '../influencer-dm-extension');

const args = [
    `--load-extension=${extPath}`,
    '--no-sandbox',
    '--disable-setuid-sandbox'
];

console.log("Spawning...", args);
const child = spawn(chromePath, args, { stdio: 'inherit' });

child.on('close', (code) => {
    console.log(`Child closed with code ${code}`);
});
