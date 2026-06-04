import { db } from '../src/db';
import { logger } from '../src/logger';

async function runAnalytics() {
    
    try {
        console.log("\n==================================================");
        console.log("   📊 INSTAGRAM OUTREACH CAMPAIGN ANALYTICS 📊    ");
        console.log("==================================================\n");

        // Fetch Pipeline Stats
        const statusRes = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM outreach_threads 
            GROUP BY status 
            ORDER BY count DESC
        `);
        
        console.log("----- 🚦 PIPELINE STATUS -----");
        let totalLeads = 0;
        statusRes.rows.forEach(row => {
            console.log(`${row.status.padEnd(20)}: ${row.count}`);
            totalLeads += parseInt(row.count, 10);
        });
        console.log(`------------------------------`);
        console.log(`TOTAL LEADS IN PIPELINE: ${totalLeads}\n`);

        // Fetch Financial/Offer Stats
        const offerRes = await db.query(`
            SELECT 
                COUNT(*) as approved_deals,
                SUM(final_offer) as total_negotiated_spend,
                AVG(final_offer) as average_deal_size
            FROM outreach_threads 
            WHERE status IN ('NEEDS_APPROVAL', 'COMPLETED') AND final_offer IS NOT NULL
        `);
        
        console.log("----- 💰 NEGOTIATION STATS -----");
        const stats = offerRes.rows[0];
        console.log(`Approved/Pending Deals: ${stats.approved_deals}`);
        console.log(`Total Negotiated Spend: $${parseFloat(stats.total_negotiated_spend || '0').toFixed(2)}`);
        console.log(`Average Deal Size     : $${parseFloat(stats.average_deal_size || '0').toFixed(2)}\n`);

        console.log("==================================================\n");

    } catch (e: any) {
        logger.error(`Failed to fetch analytics: ${e.message}`, { error: e });
    } finally {
        await db.end();
    }
}

runAnalytics().catch(e => logger.error(e));
