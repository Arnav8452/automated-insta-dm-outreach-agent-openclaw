#!/bin/bash

# Registers the native OpenClaw Gateway cron job to replace the old HEARTBEAT.md polling script.
# This runs every 10 minutes to grab PENDING or AWAITING_REPLY threads and execute the Instagram DM automation.

openclaw cron create "*/10 * * * *" \
  "Run 'npx ts-node scripts/get_pending_leads.ts' to fetch the next active lead. If their status is PENDING, send a personalized initial pitch using 'npx ts-node scripts/dm_sender.ts \"<handle>\" '<message>' \"<thread_id>\"'. If their status is AWAITING_REPLY, run 'npx ts-node scripts/check_replies.ts \"<handle>\" \"<thread_id>\"' to read their response, and use your advanced negotiation logic (defined in SKILL.md) to either counter-offer or use 'update_thread_status.ts' to mark the thread as COMPLETED or FAILED." \
  --name "Campaign Orchestrator" \
  --session isolated \
  --no-deliver \
  --light-context \
  --tz "UTC"

echo "Successfully registered the Campaign Orchestrator cron job with the OpenClaw daemon!"
echo "You can check its status anytime by running: openclaw cron list"
