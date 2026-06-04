import puppeteer from 'puppeteer';

const handle = process.argv[2];
const message = process.argv[3];

async function sendInstagramDm() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        userDataDir: "./browser_data/ig_session",
        headless: false,
        slowMo: 100,
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    try {
        console.log("Browser launched. Opening page...");
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();
        
        console.log(`Navigating to https://www.instagram.com/${handle}/...`);
        await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle2' });
        
        console.log("Looking for Message button...");
        try {
            await page.waitForFunction(() => {
                const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
                return elements.some(el => el.textContent?.trim().toLowerCase() === 'message');
            }, { timeout: 10000 });
            
            await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
                const msgBtn = elements.find(el => el.textContent?.trim().toLowerCase() === 'message');
                if (msgBtn) (msgBtn as HTMLElement).click();
            });
            console.log("Clicked Message button!");
        } catch (e) {
            console.error("Could not find Message button.");
            throw e;
        }

        console.log("Waiting for textbox...");
        const textboxSelector = "div[role='textbox']";
        await page.waitForSelector(textboxSelector, { visible: true, timeout: 15000 });
        
        console.log("Typing message...");
        await page.type(textboxSelector, message, { delay: 75 });
        console.log("Pressing Enter...");
        await page.keyboard.press("Enter");
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`SUCCESS: Dispatched DM to @${handle}`);
        
    } finally {
        await browser.close();
    }
}

sendInstagramDm().catch(console.error);
