import { db } from '../src/db';
import { logger } from '../src/logger';

async function getPendingLeads() {
    
    try {
        // We only want threads that are PENDING (new) or AWAITING_REPLY (needing follow up)
        // Join with the correct 'influencers' table and extract niche from metadata
        const query = `
            SELECT t.id as thread_id, t.status, t.max_authorized_budget, i.handle, i.metadata->>'niche' as niche, i.follower_count as estimated_followers 
            FROM outreach_threads t
            JOIN influencers i ON t.influencer_id = i.id
            WHERE t.status IN ('PENDING', 'AWAITING_REPLY')
            LIMIT 1;
        `;
        
        const res = await db.query(query);
        
        // Output pure JSON to stdout so the OpenClaw agent can easily parse it
        console.log(JSON.stringify(res.rows, null, 2));
        
    } catch (e: any) {
        logger.error(`Database query failed: ${e.message}`, { error: e });
        console.error("Database query failed:", e.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

getPendingLeads().catch(console.error);
