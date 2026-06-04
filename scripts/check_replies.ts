import puppeteer from 'puppeteer';
import { Client } from 'pg';

const handle = process.argv[2];
const threadId = process.argv[3];

if (!handle || !threadId) {
    console.error("Usage: ts-node check_replies.ts <handle> <thread_id>");
    process.exit(1);
}

async function checkReplies() {
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();
    
    try {
        const browser = await puppeteer.launch({
            userDataDir: "./browser_data/ig_session",
            headless: false,
            slowMo: 100,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
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
                await pgClient.query("UPDATE outreach_threads SET status = 'FAILED' WHERE id = $1", [threadId]);
                throw new Error(`Could not find a Message button on @${handle}'s profile. Marked thread as FAILED.`);
            }
            
            // Wait for chat to load (textbox is a good indicator)
            const textboxSelector = "div[role='textbox']";
            await page.waitForSelector(textboxSelector, { visible: true, timeout: 15000 });
            
            // Wait briefly to ensure messages are rendered
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Scrape messages
            const chatMessages = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('div[role="row"]'));
                return rows.slice(-10).map(row => {
                    // Incoming messages typically have an img tag (profile pic), outgoing do not.
                    const hasProfilePic = row.querySelector('img') !== null;
                    return {
                        sender: hasProfilePic ? 'influencer' : 'agent',
                        text: row.textContent?.trim()
                    };
                }).filter(m => m.text);
            });
            
            // Log new incoming messages to PostgreSQL
            await pgClient.query('BEGIN');
            for (const msg of chatMessages) {
                if (msg.sender === 'influencer') {
                    // Insert if not already exists (basic deduplication by exact text in this thread)
                    await pgClient.query(`
                        INSERT INTO messages (thread_id, sender_type, content) 
                        SELECT $1, 'INFLUENCER', $2
                        WHERE NOT EXISTS (
                            SELECT 1 FROM messages WHERE thread_id = $1 AND content = $2 AND sender_type = 'INFLUENCER'
                        )
                    `, [threadId, msg.text]);
                }
            }
            await pgClient.query('COMMIT');
            
            // Output JSON for the Agent to read
            console.log(JSON.stringify(chatMessages, null, 2));
            
        } finally {
            await browser.close();
        }
    } catch (err: any) {
        await pgClient.query('ROLLBACK').catch(() => {});
        console.error(`ERROR: Local execution failed: ${err.message}`);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

checkReplies().catch(console.error);
