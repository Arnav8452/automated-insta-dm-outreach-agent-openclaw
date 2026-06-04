import puppeteer from 'puppeteer';
import * as fs from 'fs';

async function test() {
    const browser = await puppeteer.launch({
        userDataDir: "./browser_data/ig_session",
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/direct/new/`, { waitUntil: 'networkidle2' });
    
    // Dump all button texts
    const buttonTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, div[role="button"], div[role="dialog"]')).map(b => b.textContent?.trim());
    });
    
    fs.writeFileSync('assets/dom_dump.json', JSON.stringify(buttonTexts, null, 2));
    await page.screenshot({ path: 'assets/direct_state.png' });
    await browser.close();
}
test().catch(console.error);
