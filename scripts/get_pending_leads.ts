import { Client } from 'pg';

async function getPendingLeads() {
    // Connect to the local PostgreSQL instance
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();
    
    try {
        // We only want threads that are PENDING (new) or AWAITING_REPLY (needing follow up)
        const query = `
            SELECT t.id as thread_id, t.status, t.max_authorized_budget, i.handle, i.niche, i.estimated_followers 
            FROM outreach_threads t
            JOIN target_influencers i ON t.influencer_handle = i.handle
            WHERE t.status IN ('PENDING', 'AWAITING_REPLY')
            LIMIT 5;
        `;
        
        const res = await pgClient.query(query);
        
        // Output pure JSON to stdout so the OpenClaw agent can easily parse it
        console.log(JSON.stringify(res.rows, null, 2));
        
    } catch (e: any) {
        console.error("Database query failed:", e.message);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

getPendingLeads().catch(console.error);
