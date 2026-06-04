---
name: instagram_dm
description: Automates fetching pending leads and sending Instagram DMs securely via local Puppeteer browser automation.
---

When you are instructed by the Campaign Orchestrator cron job to process pending leads and send outreach, follow this strict protocol:

### Step 1: Check Database for Pending Leads
First, fetch the list of pending leads that need outreach by using your native `exec` tool to run the following script:
```bash
npx ts-node scripts/get_pending_leads.ts
```
This script will return a JSON list of threads where the status is `PENDING` or `AWAITING_REPLY`.

### Step 2: Dispatch Messages
Review the JSON output. For every lead returned in Step 1, draft a highly personalized pitch (using your core Persona and the `max_authorized_budget` limit from the database), then run the DM sender script natively:
```bash
npx ts-node scripts/dm_sender.ts "<influencer_handle>" "<message_content>" "<thread_id>"
```

### Important Execution Rules
1. Do not use unescaped double quotes inside the `<message_content>` argument if they would break the bash string wrapper.
2. You do NOT need to manually update PostgreSQL. The `dm_sender.ts` script will automatically log the message into the `messages` table and update the `outreach_threads` status to `AWAITING_REPLY` upon success.
3. If the script throws an error mentioning "Action Blocked", gracefully pause the campaign and notify the user that we hit Meta's rate limits.
