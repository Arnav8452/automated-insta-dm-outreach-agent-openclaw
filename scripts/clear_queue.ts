import { Client } from 'pg';
async function clear() {
    const client = new Client({ connectionString: 'postgres://postgres:password@localhost:5432/openclaw_db' });
    await client.connect();
    await client.query("UPDATE outreach_threads SET status = 'FAILED' FROM influencers WHERE outreach_threads.influencer_id = influencers.id AND influencers.handle != '_xarnav'");
    await client.end();
}
clear();
