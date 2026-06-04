import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { db } from '../src/db';
import { logger } from '../src/logger';

interface LeadRow {
    handle: string;
    target_budget: string;
    max_authorized_budget: string;
}

async function ingestLeads() {
    const csvPath = process.argv[2] || path.join(__dirname, '../leads.csv');
    
    if (!fs.existsSync(csvPath)) {
        logger.error(`CSV file not found at: ${csvPath}`);
        process.exit(1);
    }

    const results: LeadRow[] = [];

    // Parse CSV safely via streaming
    await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    logger.info(`Parsed ${results.length} leads from CSV. Starting transactional ingestion...`);

    try {
        // Begin Transaction
        await db.query('BEGIN');

        // Create or retrieve the target campaign
        let campaignId: string;
        
        // Note: campaigns table doesn't have a UNIQUE constraint on name by default in our schema, 
        // so we'll just insert one if the table is empty for this test, or get the first one.
        const existingCampaign = await db.query(`SELECT id FROM campaigns LIMIT 1`);
        
        if (existingCampaign.rows.length > 0) {
            campaignId = existingCampaign.rows[0].id;
        } else {
            const campaignRes = await db.query(`
                INSERT INTO campaigns (name, total_budget) 
                VALUES ('Automated Outreach Campaign', 10000.00) 
                RETURNING id;
            `);
            campaignId = campaignRes.rows[0].id;
        }

        let ingestedCount = 0;

        for (const row of results) {
            const { handle, target_budget, max_authorized_budget } = row;

            if (!handle || !max_authorized_budget) {
                logger.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
                continue;
            }

            // Upsert Influencer gracefully (ON CONFLICT DO UPDATE to retrieve the ID)
            const influencerRes = await db.query(`
                INSERT INTO influencers (handle) 
                VALUES ($1) 
                ON CONFLICT (handle) DO UPDATE SET handle = EXCLUDED.handle
                RETURNING id;
            `, [handle]);
            
            const influencerId = influencerRes.rows[0].id;

            // Insert Outreach Thread safely (ON CONFLICT DO NOTHING to avoid duplicates in a campaign)
            await db.query(`
                INSERT INTO outreach_threads (campaign_id, influencer_id, status, max_authorized_budget, current_offer) 
                VALUES ($1, $2, 'PENDING', $3, $4)
                ON CONFLICT (campaign_id, influencer_id) DO NOTHING;
            `, [campaignId, influencerId, max_authorized_budget, target_budget || null]);

            ingestedCount++;
        }

        // Commit Transaction
        await db.query('COMMIT');
        logger.info(`Successfully committed ${ingestedCount} leads into PostgreSQL.`);

    } catch (error) {
        // Rollback on any failure to prevent orphaned data
        await db.query('ROLLBACK');
        logger.error("Transaction failed. Rolled back all changes.", { error });
        process.exit(1);
    } finally {
        await db.end();
    }
}

ingestLeads().catch(e => logger.error(e));
