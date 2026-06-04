import puppeteer from 'puppeteer';
import path from 'path';

const query = process.argv[2];

if (!query) {
    console.error("Usage: ts-node scout_instagram.ts <query>");
    process.exit(1);
}

async function scout() {
    const browser = await puppeteer.launch({
        userDataDir: path.join(__dirname, '../browser_data/ig_session'),
        headless: true, // Run in background silently
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    try {
        const page = await browser.newPage();
        
        // Go to Instagram's internal search API endpoint
        // It returns a JSON object directly if authenticated
        const url = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(query)}`;
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Extract the raw text from the body
        const jsonText = await page.evaluate(() => document.body.innerText);
        
        try {
            const data = JSON.parse(jsonText);
            
            if (data.users && Array.isArray(data.users)) {
                // Map out the top 5 results
                const users = data.users.map((u: any) => {
                    const user = u.user || {};
                    return {
                        handle: user.username,
                        fullName: user.full_name,
                        followers: user.follower_count || 'Unknown',
                        isVerified: user.is_verified || false
                    };
                }).slice(0, 5);
                
                // Return clean JSON to stdout for the LLM
                console.log(JSON.stringify(users, null, 2));
            } else {
                console.error("Failed to parse expected JSON structure from Instagram API.");
                console.error("Raw response snippet:", jsonText.substring(0, 200));
            }
        } catch (parseErr) {
            console.error("Failed to parse JSON response from Instagram:", parseErr);
        }
        
    } catch (e: any) {
        console.error("ERROR: Scouting failed:", e.message);
    } finally {
        await browser.close();
    }
}

scout().catch(console.error);
