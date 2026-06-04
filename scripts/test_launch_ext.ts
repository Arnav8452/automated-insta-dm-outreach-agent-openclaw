import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

const EXTENSION_PATH = path.resolve(__dirname, '../influencer-dm-extension').replace(/\\/g, '/');
const USER_DATA_DIR = path.resolve(__dirname, `../browser_data/test_session_${Date.now()}`);

async function test() {
    console.log(`EXTENSION_PATH: ${EXTENSION_PATH}`);
    console.log(`USER_DATA_DIR: ${USER_DATA_DIR}`);
    
    // Ensure dir exists
    if (!fs.existsSync(USER_DATA_DIR)) {
        fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    }

    console.log("Launching...");
    try {
        const browser = await puppeteer.launch({
            headless: false,
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [
                `--load-extension=${EXTENSION_PATH}`,
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            defaultViewport: null
        });
        console.log("Launched!");
        await browser.close();
        console.log("Closed!");
    } catch (e) {
        console.error("Failed!", e);
    }
}
test();
