import { db } from '../src/db';
import { logger } from '../src/logger';

async function getActiveThreads() {

    try {
        const res = await db.query(`
            SELECT t.id as thread_id, i.handle, t.status
            FROM outreach_threads t
            JOIN influencers i ON t.influencer_id = i.id
            WHERE t.status = 'AWAITING_REPLY'
        `);

        if (res.rows.length === 0) {
            console.log(JSON.stringify({ status: "success", threads: [] }));
        } else {
            console.log(JSON.stringify({ status: "success", threads: res.rows }));
        }
    } catch (e: any) {
        logger.error("getActiveThreads failed", { error: e.message });
        console.error(JSON.stringify({ status: "error", error: e.message }));
        process.exit(1);
    } finally {
        await db.end();
    }
}

getActiveThreads();
