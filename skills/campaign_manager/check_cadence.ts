import { Client } from 'pg';

async function checkCadence() {
    const pgClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await pgClient.connect();

    try {
        const res = await pgClient.query(`
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
        console.error(JSON.stringify({ status: "error", error: e.message }));
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

checkCadence();
