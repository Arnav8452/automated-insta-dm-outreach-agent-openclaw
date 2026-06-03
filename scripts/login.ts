import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function setupInstagramSession() {
    console.log("Launching Chromium to capture Instagram Authentication...");
    
    // Ensure the local data directory exists so cookies are saved securely
    const dataDir = path.join(__dirname, '../browser_data/ig_session');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        userDataDir: dataDir, // This is the magic! It saves your session permanently.
        headless: false, // Must be false so you can physically log in
        defaultViewport: null, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });

    console.log("---------------------------------------------------------");
    console.log("ACTION REQUIRED: Please log into Instagram in the popup window.");
    console.log("Solve any 2FA or CAPTCHAs natively. Your cookies will be saved locally.");
    console.log("Once you are fully logged in and see your feed, return to this terminal.");
    console.log("Press Ctrl+C to safely close the browser and save the session.");
    console.log("---------------------------------------------------------");

    // Keep the browser open indefinitely so you have time to login and solve 2FA
    await new Promise(() => {});
}

setupInstagramSession().catch(console.error);
