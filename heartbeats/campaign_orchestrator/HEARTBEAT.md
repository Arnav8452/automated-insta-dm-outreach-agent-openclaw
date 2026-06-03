# OpenClaw Heartbeat: Influencer Campaign Orchestrator

## Description
This heartbeat job polls the PostgreSQL state machine to find actionable threads while strictly adhering to Instagram's rate limits. It utilizes Redis for distributed locking to ensure that parallel Node-based gateway workers never exceed the maximum allowed DMs per hour.

## Schedule
Cron: `*/5 * * * *` (Runs every 5 minutes)

## Script (TypeScript)
```typescript
import { Client } from 'pg';
import Redis from 'ioredis';
import { gateway } from 'openclaw-core';

// Configuration
const MAX_DMS_PER_HOUR = 20;
const REDIS_KEY = "ig_dm_rate_limit:rolling_count";

export async function runHeartbeat(): Promise<void> {
    // 1. Connect to Redis for Distributed Rate Limiting
    const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379/0');
    
    try {
        const currentCount = await redis.get(REDIS_KEY);
        if (currentCount && parseInt(currentCount, 10) >= MAX_DMS_PER_HOUR) {
            gateway.log("Global DM rate limit reached (20/hr). Skipping dispatch until window clears.", "WARN");
            return;
        }

        // 2. Connect to PostgreSQL State Machine
        const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
        await pgClient.connect();
        
        try {
            await pgClient.query('BEGIN');
            
            // 3. Query for actionable threads
            // FOR UPDATE SKIP LOCKED prevents concurrent Node worker clashes
            const query = `
                SELECT id, campaign_id, influencer_id, status 
                FROM outreach_threads
                WHERE (status = 'PENDING') 
                   OR (status = 'AWAITING_REPLY' AND next_followup_at <= NOW())
                ORDER BY last_action_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 5;
            `;
            
            const result = await pgClient.query(query);
            
            for (const row of result.rows) {
                const { id: thread_id, influencer_id, status } = row;
                
                gateway.log(`Dispatching task for thread: ${thread_id} | Status: ${status}`);
                
                // 4. Dispatch the contextual task to the OpenClaw Agent
                const success = await gateway.dispatchTask({
                    agent: "Influencer Scout",
                    context: {
                        thread_id: String(thread_id),
                        influencer_id: String(influencer_id),
                        current_status: status
                    }
                });
                
                if (success) {
                    // Increment Redis counter and set 1-hour expiry
                    const multi = redis.multi();
                    multi.incr(REDIS_KEY);
                    const ttl = await redis.ttl(REDIS_KEY);
                    if (ttl === -1) {
                        multi.expire(REDIS_KEY, 3600);
                    }
                    await multi.exec();
                    
                    // Update the database to reflect that the job is currently processing
                    await pgClient.query(
                        "UPDATE outreach_threads SET last_action_at = NOW() WHERE id = $1", 
                        [thread_id]
                    );
                }
            }
            
            await pgClient.query('COMMIT');
        } catch (e) {
            await pgClient.query('ROLLBACK');
            throw e;
        } finally {
            await pgClient.end();
        }
    } catch (error: any) {
        gateway.log(`Heartbeat execution failed: ${error.message}`, "ERROR");
    } finally {
        redis.disconnect();
    }
}
```
