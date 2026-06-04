import { db } from '../src/db';
import { logger } from '../src/logger';
async function clear() {
    try {
        await db.query("UPDATE outreach_threads SET status = 'FAILED' FROM influencers WHERE outreach_threads.influencer_id = influencers.id AND influencers.handle != '_xarnav'");
    } catch (e: any) {
        logger.error("clear_queue failed", { error: e });
    } finally {
        await db.end();
    }
}
clear();
