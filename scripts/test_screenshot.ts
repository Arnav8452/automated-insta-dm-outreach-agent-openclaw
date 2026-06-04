import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

async function test() {
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({
        userDataDir: "./browser_data/ig_session",
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    
    try {
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();
        
        await page.goto('https://www.instagram.com/_xarnav/', { waitUntil: 'networkidle2' });
        
        await page.waitForFunction(() => {
            const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
            return elements.some(el => el.textContent?.trim().toLowerCase() === 'message');
        }, { timeout: 10000 });
        
        await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
            const msgBtn = elements.find(el => el.textContent?.trim().toLowerCase() === 'message');
            if (msgBtn) (msgBtn as HTMLElement).click();
        });
        
        await page.waitForSelector("div[role='textbox']", { visible: true, timeout: 15000 });
        await new Promise(r => setTimeout(r, 4000));
        
        await page.screenshot({ path: 'assets/chat_debug.png' });
        
        const domDump = await page.evaluate(() => {
            return document.body.innerHTML;
        });
        require('fs').writeFileSync('assets/chat_dom.html', domDump);
        
        console.log("Screenshot saved.");
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
test();
