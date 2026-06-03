import { Client } from 'pg';

const handle = process.argv[2];
const niche = process.argv[3] || 'general';
const followers = parseInt(process.argv[4] || '0', 10);

if (!handle) {
    console.error("Usage: ts-node inject_scouted_lead.ts <handle> [niche] [estimated_followers]");
    process.exit(1);
}

async function injectLead() {
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();
    
    try {
        await pgClient.query('BEGIN');
        
        // 1. Insert or update the target influencer
        await pgClient.query(
            `INSERT INTO target_influencers (handle, niche, estimated_followers) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (handle) DO UPDATE 
             SET niche = EXCLUDED.niche, estimated_followers = EXCLUDED.estimated_followers`,
            [handle, niche, followers]
        );
        
        // 2. Check if a thread already exists
        const threadCheck = await pgClient.query(
            "SELECT id FROM outreach_threads WHERE influencer_handle = $1",
            [handle]
        );
        
        if (threadCheck.rows.length === 0) {
            // 3. Create a PENDING thread so the cron job picks it up
            await pgClient.query(
                `INSERT INTO outreach_threads (influencer_handle, status, max_authorized_budget) 
                 VALUES ($1, 'PENDING', 100)`,
                [handle]
            );
            console.log(`SUCCESS: Injected @${handle} into database. Thread status is PENDING.`);
        } else {
            console.log(`SKIPPED: @${handle} already exists in active outreach threads.`);
        }
        
        await pgClient.query('COMMIT');
    } catch (err: any) {
        await pgClient.query('ROLLBACK').catch(() => {});
        console.error(`ERROR: Failed to inject lead: ${err.message}`);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

injectLead().catch(console.error);
