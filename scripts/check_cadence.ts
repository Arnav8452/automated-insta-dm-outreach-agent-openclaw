import { db } from '../src/db';
import { logger } from '../src/logger';

async function checkCadence() {

    try {
        const res = await db.query(`
            SELECT t.id as thread_id, i.handle
            FROM outreach_threads t
            JOIN influencers i ON t.influencer_id = i.id
            WHERE t.status = 'AWAITING_REPLY' 
              AND t.next_followup_at <= NOW()
        `);

        if (res.rows.length === 0) {
            console.log(JSON.stringify({ status: "success", due_followups: [] }));
        } else {
            console.log(JSON.stringify({ status: "success", due_followups: res.rows }));
        }
    } catch (e: any) {
        logger.error("checkCadence failed", { error: e.message });
        console.error(JSON.stringify({ status: "error", error: e.message }));
        process.exit(1);
    } finally {
        await db.end();
    }
}

checkCadence();
