import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { TimeoutError } from 'puppeteer';
import { Client } from 'pg';

const handle = process.argv[2];
const message = process.argv[3];
const threadId = process.argv[4];

if (!handle || !message || !threadId) {
    console.error("Usage: ts-node dm_sender.ts <handle> <message> <thread_id>");
    process.exit(1);
}

async function sendInstagramDm() {
    // Connect locally so testing native Node execution works seamlessly
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();
    
    try {
        puppeteer.use(StealthPlugin());
        
        // 1. Launch persistent context to maintain authentication cookies
        const browser = await puppeteer.launch({
            userDataDir: "./browser_data/ig_session",
            headless: false, // Run in headful/visible mode natively on OS
            slowMo: 100, // Human-like delays between actions
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
            
            // 2. Navigate to the user's profile
            await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle2' });
            
            // Smart Three-Case Logic
            let msgFound = false;
            try {
                // Try to find message button immediately
                await page.waitForFunction(() => {
                    const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
                    return elements.some(el => el.textContent?.trim().toLowerCase() === 'message');
                }, { timeout: 3000 });
                msgFound = true;
            } catch (e) {
                // Message button not found immediately
            }

            if (msgFound) {
                // Case 1: Direct DM
                await page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
                    const msgBtn = elements.find(el => el.textContent?.trim().toLowerCase() === 'message');
                    if (msgBtn) (msgBtn as HTMLElement).click();
                });
            } else {
                // Look for Follow button
                let followFound = false;
                try {
                    await page.waitForFunction(() => {
                        const elements = Array.from(document.querySelectorAll('div[role="button"], button'));
                        return elements.some(el => el.textContent?.trim().toLowerCase() === 'follow');
                    }, { timeout: 3000 });
                    followFound = true;
                } catch (e) {}

                if (followFound) {
                    await page.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('div[role="button"], button'));
                        const followBtn = elements.find(el => el.textContent?.trim().toLowerCase() === 'follow');
                        if (followBtn) (followBtn as HTMLElement).click();
                    });
                    
                    // Wait to see if it was accepted instantly (public account) or requested (private)
                    await new Promise(r => setTimeout(r, 2000));
                    
                    // Check for Message button again
                    try {
                        await page.waitForFunction(() => {
                            const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
                            return elements.some(el => el.textContent?.trim().toLowerCase() === 'message');
                        }, { timeout: 3000 });
                        
                        // Case 2: Follow + DM
                        await page.evaluate(() => {
                            const elements = Array.from(document.querySelectorAll('div[role="button"], a[role="link"], button'));
                            const msgBtn = elements.find(el => el.textContent?.trim().toLowerCase() === 'message');
                            if (msgBtn) (msgBtn as HTMLElement).click();
                        });
                    } catch (e) {
                        // Case 3: Follow + Waitlist (Private Account)
                        await pgClient.query('BEGIN');
                        await pgClient.query(
                            "UPDATE outreach_threads SET status = 'WAITLISTED', last_action_at = NOW() WHERE id = $1",
                            [threadId]
                        );
                        await pgClient.query('COMMIT');
                        console.log(`WAITLISTED: Follow request sent to @${handle}, waiting for approval.`);
                        await browser.close();
                        await pgClient.end();
                        process.exit(0);
                    }
                } else {
                    // Look for Requested button
                    let requestedFound = false;
                    try {
                        await page.waitForFunction(() => {
                            const elements = Array.from(document.querySelectorAll('div[role="button"], button'));
                            return elements.some(el => el.textContent?.trim().toLowerCase() === 'requested');
                        }, { timeout: 2000 });
                        requestedFound = true;
                    } catch(e) {}
                    
                    if (requestedFound) {
                        console.log(`STILL WAITLISTED: Follow request to @${handle} is still pending approval.`);
                        await browser.close();
                        process.exit(0);
                    } else {
                        // Neither Follow, Message, nor Requested found
                        await page.screenshot({ path: 'assets/profile_screenshot.png' });
                        throw new Error(`Could not find a Message, Follow, or Requested button on @${handle}'s profile. They may not accept DMs.`);
                    }
                }
            }
            
            // 3. Detect Action Blocks or Shadowbans robustly via text queries
            const actionBlocked = await page.$("::-p-text(Action Blocked)");
            const tryAgain = await page.$("::-p-text(Try Again Later)");
            
            if (actionBlocked || tryAgain) {
                throw new Error("Instagram Action Block detected.");
            }
                
            // 4. Target the message input box securely via ARIA attributes
            const textboxSelector = "div[role='textbox']";
            try {
                await page.waitForSelector(textboxSelector, { visible: true, timeout: 15000 });
            } catch (timeoutErr) {
                await page.screenshot({ path: 'assets/timeout_screenshot.png' });
                throw timeoutErr;
            }
            
            // 5. Type and send (simulating human input)
            await page.type(textboxSelector, message, { delay: 75 }); // 75ms per keystroke
            await page.keyboard.press("Enter");
            
            // Wait briefly for the network request to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await pgClient.query('BEGIN');
            // 6. Log the successfully sent message to the PostgreSQL context table
            await pgClient.query(
                "INSERT INTO messages (thread_id, sender_type, content) VALUES ($1, 'AGENT', $2)",
                [threadId, message]
            );
            
            // Update the thread state to AWAITING_REPLY and schedule first auto-cadence
            await pgClient.query(
                "UPDATE outreach_threads SET status = 'AWAITING_REPLY', last_action_at = NOW(), next_followup_at = NOW() + INTERVAL '24 hours' WHERE id = $1",
                [threadId]
            );
            await pgClient.query('COMMIT');
            
            console.log(`SUCCESS: Dispatched DM to @${handle}`);
            
        } finally {
            await browser.close();
        }
            
    } catch (err: any) {
        await pgClient.query('ROLLBACK').catch(() => {});
        
        const errorMsg = err.message || String(err);
        
        // 7. Safe Fallback: Flag rate limited state in PostgreSQL
        if (errorMsg.includes("Action Block")) {
            try {
                await pgClient.query(
                    "UPDATE outreach_threads SET status = 'RATE_LIMITED' WHERE id = $1",
                    [threadId]
                );
            } catch (dbErr) {
                // Ignore DB fallback error
            }
        } else if (errorMsg.includes("They may not accept DMs")) {
            try {
                // Mark thread as failed so the cron job doesn't endlessly retry it
                await pgClient.query(
                    "UPDATE outreach_threads SET status = 'FAILED' WHERE id = $1",
                    [threadId]
                );
            } catch (dbErr) {
                // Ignore DB fallback error
            }
        }
        
        console.error(`ERROR: Local execution failed: ${errorMsg}`);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

sendInstagramDm().catch(console.error);
