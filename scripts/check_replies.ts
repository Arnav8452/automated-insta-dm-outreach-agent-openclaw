import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../src/db';
import { logger } from '../src/logger';

const handle = process.argv[2];
const threadId = process.argv[3];

if (!handle || !threadId) {
    console.error("Usage: ts-node check_replies.ts <handle> <thread_id>");
    process.exit(1);
}

async function checkReplies() {
    
    let browser: any = null;
    try {
        puppeteer.use(StealthPlugin());
        
        browser = await puppeteer.launch({
            userDataDir: "./browser_data/ig_session",
            headless: false,
            slowMo: 100,
            defaultViewport: { width: 1280, height: 720 },
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ] 
        });
        
        try {
            const pages = await browser.pages();
            const page = pages.length > 0 ? pages[0] : await browser.newPage();
            
            // Navigate to profile and click message
            await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle2' });
            
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
            } catch (e) {
                // If no message button, mark as FAILED
                await db.query("UPDATE outreach_threads SET status = 'FAILED' WHERE id = $1", [threadId]);
                throw new Error(`Could not find a Message button on @${handle}'s profile. Marked thread as FAILED.`);
            }
            
            // Wait for chat to load (textbox is a good indicator)
            const textboxSelector = "div[role='textbox']";
            await page.waitForSelector(textboxSelector, { visible: true, timeout: 15000 });
            
            // Wait briefly to ensure messages are rendered
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Scrape messages
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
            
            // Log new incoming messages to PostgreSQL
            await db.query('BEGIN');
            for (const msg of chatMessages) {
                if (msg.sender === 'influencer') {
                    // Insert if not already exists (basic deduplication by exact text in this thread)
                    await db.query(`
                        INSERT INTO messages (thread_id, sender_type, content) 
                        SELECT $1, 'INFLUENCER', $2
                        WHERE NOT EXISTS (
                            SELECT 1 FROM messages WHERE thread_id = $1 AND content = $2 AND sender_type = 'INFLUENCER'
                        )
                    `, [threadId, msg.text]);
                }
            }
            await db.query('COMMIT');
            
            // Output JSON for the Agent to read
            console.log(JSON.stringify(chatMessages, null, 2));
            
        } finally {
            await browser.close();
        }
    } catch (err: any) {
        await db.query('ROLLBACK').catch(() => {});
        
        try {
            if (browser) {
                const pages = await browser.pages();
                if (pages.length > 0) {
                    await pages[0].screenshot({ path: `assets/fatal_error_replies_${Date.now()}.png` });
                }
            }
        } catch (screenshotErr) {}

        logger.error(`Local execution failed: ${err.message}`);
        process.exit(1);
    } finally {
        await db.end();
    }
}

checkReplies().catch(e => logger.error(e));
