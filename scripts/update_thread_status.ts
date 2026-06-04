import { Client } from 'pg';

const threadId = process.argv[2];
const status = process.argv[3];

if (!threadId || !status) {
    console.error("Usage: ts-node update_thread_status.ts <thread_id> <STATUS>");
    process.exit(1);
}

const validStatuses = ['PENDING', 'AWAITING_REPLY', 'COMPLETED', 'FAILED', 'RATE_LIMITED'];

if (!validStatuses.includes(status)) {
    console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
}

async function updateStatus() {
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();
    
    try {
        const res = await pgClient.query(
            "UPDATE outreach_threads SET status = $1, last_action_at = NOW() WHERE id = $2 RETURNING *",
            [status, threadId]
        );
        
        if (res.rows.length === 0) {
            console.error(`Thread ${threadId} not found.`);
            process.exit(1);
        }
        
        console.log(`SUCCESS: Thread ${threadId} status updated to ${status}`);
    } catch (e: any) {
        console.error(`ERROR: Failed to update thread status: ${e.message}`);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

updateStatus().catch(console.error);
