import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import * as path from 'path';

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const extPath = path.resolve(__dirname, '../influencer-dm-extension');
const userDataDir = path.resolve(__dirname, `../browser_data/test_connect_${Date.now()}`);

async function test() {
    console.log("Spawning Edge manually...");
    const browserProcess = spawn(chromePath, [
        `--user-data-dir=${userDataDir}`,
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--no-default-browser-check'
    ], { detached: true, stdio: 'ignore' });
    
    browserProcess.unref(); // Let it run independently

    console.log("Waiting 3s for Edge to start...");
    await new Promise(r => setTimeout(r, 3000));

    console.log("Connecting Puppeteer...");
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log("Connected successfully!");
        await browser.close(); // Note: browser.close() on connect only disconnects, but might close if we evaluate something
    } catch (e) {
        console.error("Failed to connect", e);
    }
}
test();
