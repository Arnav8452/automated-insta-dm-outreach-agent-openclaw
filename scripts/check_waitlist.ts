import { db } from '../src/db';
import { logger } from '../src/logger';

async function checkWaitlist() {

    try {
        const res = await db.query(`
            SELECT t.id as thread_id, i.handle
            FROM outreach_threads t
            JOIN influencers i ON t.influencer_id = i.id
            WHERE t.status = 'WAITLISTED'
        `);

        if (res.rows.length === 0) {
            console.log(JSON.stringify({ status: "success", waitlisted: [] }));
        } else {
            console.log(JSON.stringify({ status: "success", waitlisted: res.rows }));
        }
    } catch (e: any) {
        logger.error("checkWaitlist failed", { error: e.message });
        console.error(JSON.stringify({ status: "error", error: e.message }));
        process.exit(1);
    } finally {
        await db.end();
    }
}

checkWaitlist();
