import { db } from '../src/db';
import { logger } from '../src/logger';

const threadId = process.argv[2];
const status = process.argv[3];
const finalOffer = process.argv[4] ? parseFloat(process.argv[4]) : null;
const deliverables = process.argv[5] || null;

if (!threadId || !status) {
    console.error("Usage: ts-node update_thread_status.ts <thread_id> <STATUS> [final_offer] [deliverables]");
    process.exit(1);
}

const validStatuses = ['PENDING', 'AWAITING_REPLY', 'COMPLETED', 'FAILED', 'RATE_LIMITED', 'NEEDS_APPROVAL', 'WAITLISTED'];

if (!validStatuses.includes(status)) {
    console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
}

async function updateStatus() {
    try {
        const res = await db.query(
            "UPDATE outreach_threads SET status = $1, final_offer = COALESCE($2, final_offer), deliverables_agreed_upon = COALESCE($3, deliverables_agreed_upon), last_action_at = NOW() WHERE id = $4 RETURNING *",
            [status, finalOffer, deliverables, threadId]
        );
        
        if (res.rows.length === 0) {
            logger.error(`Thread ${threadId} not found.`);
            process.exit(1);
        }
        
        logger.info(`SUCCESS: Thread ${threadId} status updated to ${status}`);
    } catch (e: any) {
        logger.error(`Failed to update thread status: ${e.message}`, { error: e });
        process.exit(1);
    } finally {
        await db.end();
    }
}

updateStatus().catch(e => logger.error(e));
