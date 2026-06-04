#!/bin/bash

# Registers the native OpenClaw Gateway cron job to replace the old HEARTBEAT.md polling script.
# This runs every 10 minutes to grab PENDING or AWAITING_REPLY threads and execute the Instagram DM automation.

openclaw cron create "*/10 * * * *" \
  "Run 'npx ts-node scripts/get_pending_leads.ts' using your exec tool to fetch the JSON queue of pending leads. Then, for each lead in the output, draft a personalized DM using the max_authorized_budget constraint, and use your exec tool to run 'npx ts-node scripts/dm_sender.ts \"<handle>\" '<message>' \"<thread_id>\"' to physically send the DM via Puppeteer." \
  --name "Campaign Orchestrator" \
  --session isolated \
  --no-deliver \
  --light-context \
  --tz "UTC"

echo "Successfully registered the Campaign Orchestrator cron job with the OpenClaw daemon!"
echo "You can check its status anytime by running: openclaw cron list"
