import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({
        userDataDir: "./browser_data/ig_session",
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/direct/new/`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'assets/direct_state.png' });
    await browser.close();
}
test().catch(console.error);
