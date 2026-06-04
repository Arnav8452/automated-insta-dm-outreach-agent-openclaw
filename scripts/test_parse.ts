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
        
        const chatMessages = await page.evaluate(() => {
            const messages: any[] = [];
            // Find all text nodes in the chat area
            const allTextDivs = Array.from(document.querySelectorAll('div[dir="auto"]')).filter(d => {
                const text = d.textContent?.trim();
                return text && text.length > 0 && text !== 'Message' && text !== 'Following';
            });
            
            for (const div of allTextDivs) {
                const text = div.textContent?.trim();
                if (!text) continue;
                
                // Climb the DOM tree to find alignment
                let el: HTMLElement | null = div as HTMLElement;
                let isIncoming = true; // Default to incoming
                
                for (let i = 0; i < 6; i++) {
                    if (!el) break;
                    const style = window.getComputedStyle(el);
                    // Outgoing messages are aligned to flex-end (right side)
                    if (style.justifyContent === 'flex-end' || style.alignItems === 'flex-end') {
                        isIncoming = false;
                        break;
                    }
                    el = el.parentElement;
                }
                
                messages.push({
                    sender: isIncoming ? 'influencer' : 'agent',
                    text: text
                });
            }
            
            return messages;
        });
        
        console.log(JSON.stringify(chatMessages, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
test();
