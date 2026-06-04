import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({
        userDataDir: "./browser_data/ig_session",
        headless: false,
        defaultViewport: { width: 375, height: 812, isMobile: true, hasTouch: true },
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    await page.goto(`https://www.instagram.com/_xarnav/`, { waitUntil: 'networkidle2' });
    
    try {
        const hasMessageBtn = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
            return elements.some(el => el.textContent?.trim().toLowerCase() === 'message');
        });
        console.log("Has Message Button:", hasMessageBtn);
    } catch (e) {
        console.error(e);
    }
    await page.screenshot({ path: 'assets/mobile_state.png' });
    await browser.close();
}
test().catch(console.error);
