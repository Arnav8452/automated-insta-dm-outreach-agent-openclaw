import { db } from '../src/db';
import { logger } from '../src/logger';

const handle = process.argv[2];
const metadataStr = process.argv[3] || '{}';

if (!handle) {
    logger.error("Usage: node inject_scouted_lead.js <handle> '<metadata_json_string>'");
    process.exit(1);
}

let metadata: any = {};
try {
    metadata = JSON.parse(metadataStr);
} catch (e) {
    logger.warn("Warning: Could not parse metadata JSON. Using empty object.");
}

const followers = parseInt(metadata.followers || '0', 10);
const bio = metadata.bio || '';
const profileUrl = metadata.profile_url || '';
const language = metadata.language || '';
const geography = metadata.geography || '';
const leadScore = parseInt(metadata.lead_score || '0', 10);
const brandFitNotes = metadata.brand_fit_notes || '';

async function injectLead() {
    
    try {
        await db.query('BEGIN');
        
        // 1. Insert or update the target influencer using the correct 'influencers' table
        const infRes = await db.query(
            `INSERT INTO influencers (handle, follower_count, bio, profile_url, language, geography, lead_score, brand_fit_notes, metadata) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             ON CONFLICT (handle) DO UPDATE 
             SET follower_count = EXCLUDED.follower_count, 
                 bio = EXCLUDED.bio, 
                 profile_url = EXCLUDED.profile_url, 
                 language = EXCLUDED.language, 
                 geography = EXCLUDED.geography, 
                 lead_score = EXCLUDED.lead_score, 
                 brand_fit_notes = EXCLUDED.brand_fit_notes,
                 metadata = EXCLUDED.metadata
             RETURNING id`,
            [handle, followers, bio, profileUrl, language, geography, leadScore, brandFitNotes, JSON.stringify(metadata)]
        );
        const influencerId = infRes.rows[0].id;
        
        // 2. Check if a thread already exists
        const threadCheck = await db.query(
            "SELECT id FROM outreach_threads WHERE influencer_id = $1",
            [influencerId]
        );
        
        if (threadCheck.rows.length === 0) {
            // Ensure a campaign exists before making a thread
            let campaignId: string;
            const existingCampaign = await db.query(`SELECT id FROM campaigns LIMIT 1`);
            
            if (existingCampaign.rows.length > 0) {
                campaignId = existingCampaign.rows[0].id;
            } else {
                const campaignRes = await db.query(`
                    INSERT INTO campaigns (name, total_budget) 
                    VALUES ('Automated Scouted Campaign', 10000.00) 
                    RETURNING id;
                `);
                campaignId = campaignRes.rows[0].id;
            }

            // 3. Create a PENDING thread so the cron job picks it up
            await db.query(
                `INSERT INTO outreach_threads (campaign_id, influencer_id, status, max_authorized_budget) 
                 VALUES ($1, $2, 'PENDING', 100)`,
                [campaignId, influencerId]
            );
            logger.info(`SUCCESS: Injected @${handle} into database. Thread status is PENDING.`);
        } else {
            logger.info(`SKIPPED: @${handle} already exists in active outreach threads.`);
        }
        
        await db.query('COMMIT');
    } catch (err: any) {
        await db.query('ROLLBACK').catch(() => {});
        logger.error(`Failed to inject lead: ${err.message}`);
        process.exit(1);
    } finally {
        await db.end();
    }
}

injectLead().catch(e => logger.error(e));
