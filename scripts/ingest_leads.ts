import fs from 'fs';
import csv from 'csv-parser';
import { Client } from 'pg';
import path from 'path';

interface LeadRow {
    handle: string;
    target_budget: string;
    max_authorized_budget: string;
}

async function ingestLeads() {
    const csvPath = process.argv[2] || path.join(__dirname, '../leads.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        process.exit(1);
    }

    // Connect using localhost for manual CLI execution against the Docker container
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();

    const results: LeadRow[] = [];

    // Parse CSV safely via streaming
    await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Parsed ${results.length} leads from CSV. Starting transactional ingestion...`);

    try {
        // Begin Transaction
        await pgClient.query('BEGIN');

        // Create or retrieve the target campaign
        let campaignId: string;
        
        // Note: campaigns table doesn't have a UNIQUE constraint on name by default in our schema, 
        // so we'll just insert one if the table is empty for this test, or get the first one.
        const existingCampaign = await pgClient.query(`SELECT id FROM campaigns LIMIT 1`);
        
        if (existingCampaign.rows.length > 0) {
            campaignId = existingCampaign.rows[0].id;
        } else {
            const campaignRes = await pgClient.query(`
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
                console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
                continue;
            }

            // Upsert Influencer gracefully (ON CONFLICT DO UPDATE to retrieve the ID)
            const influencerRes = await pgClient.query(`
                INSERT INTO influencers (handle) 
                VALUES ($1) 
                ON CONFLICT (handle) DO UPDATE SET handle = EXCLUDED.handle
                RETURNING id;
            `, [handle]);
            
            const influencerId = influencerRes.rows[0].id;

            // Insert Outreach Thread safely (ON CONFLICT DO NOTHING to avoid duplicates in a campaign)
            await pgClient.query(`
                INSERT INTO outreach_threads (campaign_id, influencer_id, status, max_authorized_budget, current_offer) 
                VALUES ($1, $2, 'PENDING', $3, $4)
                ON CONFLICT (campaign_id, influencer_id) DO NOTHING;
            `, [campaignId, influencerId, max_authorized_budget, target_budget || null]);

            ingestedCount++;
        }

        // Commit Transaction
        await pgClient.query('COMMIT');
        console.log(`Successfully committed ${ingestedCount} leads into PostgreSQL.`);

    } catch (error) {
        // Rollback on any failure to prevent orphaned data
        await pgClient.query('ROLLBACK');
        console.error("Transaction failed. Rolled back all changes.");
        console.error(error);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

ingestLeads();
