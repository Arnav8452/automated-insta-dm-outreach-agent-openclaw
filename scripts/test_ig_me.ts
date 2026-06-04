import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({
        userDataDir: "./browser_data/ig_session",
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.goto(`https://ig.me/m/_xarnav`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'assets/ig_me_state.png' });
    await browser.close();
}
test().catch(console.error);
