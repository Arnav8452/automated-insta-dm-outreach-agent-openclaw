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
        
        // 1. Insert or update the target influencer using the correct 'influencers' table
        const infRes = await pgClient.query(
            `INSERT INTO influencers (handle, follower_count, metadata) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (handle) DO UPDATE 
             SET follower_count = EXCLUDED.follower_count, metadata = EXCLUDED.metadata
             RETURNING id`,
            [handle, followers, JSON.stringify({ niche })]
        );
        const influencerId = infRes.rows[0].id;
        
        // 2. Check if a thread already exists
        const threadCheck = await pgClient.query(
            "SELECT id FROM outreach_threads WHERE influencer_id = $1",
            [influencerId]
        );
        
        if (threadCheck.rows.length === 0) {
            // Ensure a campaign exists before making a thread
            let campaignId: string;
            const existingCampaign = await pgClient.query(`SELECT id FROM campaigns LIMIT 1`);
            
            if (existingCampaign.rows.length > 0) {
                campaignId = existingCampaign.rows[0].id;
            } else {
                const campaignRes = await pgClient.query(`
                    INSERT INTO campaigns (name, total_budget) 
                    VALUES ('Automated Scouted Campaign', 10000.00) 
                    RETURNING id;
                `);
                campaignId = campaignRes.rows[0].id;
            }

            // 3. Create a PENDING thread so the cron job picks it up
            await pgClient.query(
                `INSERT INTO outreach_threads (campaign_id, influencer_id, status, max_authorized_budget) 
                 VALUES ($1, $2, 'PENDING', 100)`,
                [campaignId, influencerId]
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
