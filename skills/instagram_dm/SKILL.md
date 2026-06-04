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

### Step 2: Dispatch a Single Message
Review the JSON output. You must pick **ONLY THE FIRST LEAD** returned. Draft a highly personalized pitch for that specific lead, then run the DM sender script natively:
```bash
npx ts-node scripts/dm_sender.ts "<influencer_handle>" '<message_content>' "<thread_id>"
```

### Important Execution Rules
1. **CRITICAL POWERSHELL RULE:** You must wrap the `<message_content>` argument in SINGLE QUOTES (`'...'`), NOT double quotes! Since this runs on Windows PowerShell, double quotes will cause it to crash if you include budget numbers (e.g. `$1000` evaluates as an empty variable). Use single quotes to ensure it treats the `$` as a literal string. If you use single quotes inside your message (e.g. `I'm`), escape them!
2. You do NOT need to manually update PostgreSQL. The `dm_sender.ts` script will automatically log the message into the `messages` table and update the `outreach_threads` status to `AWAITING_REPLY` upon success.
3. If the script throws an error mentioning "Action Blocked", gracefully pause the campaign and notify the user that we hit Meta's rate limits.
4. **DO NOT** attempt to set or pass environment variables (like `DATABASE_URL`) in your `exec` command. The scripts natively handle their own database connections. Run the raw commands exactly as written.
5. The `dm_sender.ts` script takes time because it physically drives a browser. If your `exec` tool returns "Command still running...", it means the script successfully launched in the background. **DO NOT** attempt to run `process list` or check its status. Simply consider it successfully dispatched and move on to the next lead.
6. **RATE LIMITING:** Never process more than one lead per cron execution. Launching multiple browsers concurrently will lock the Chromium profile and crash the scripts. Processing one lead every 10 minutes ensures human-like cadence and avoids Meta shadowbans.
