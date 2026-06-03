#!/bin/bash

# Registers the native OpenClaw Gateway cron job to replace the old HEARTBEAT.md polling script.
# This runs every 10 minutes to grab PENDING or AWAITING_REPLY threads and execute the Instagram DM automation.

openclaw cron create "*/10 * * * *" \
  "Check the PostgreSQL database for any outreach_threads where status is 'PENDING' or 'AWAITING_REPLY'. If they need a message sent, draft it using the max_authorized_budget constraint, and use the 'exec' tool to run scripts/dm_sender.ts to physically send the DM via Puppeteer." \
  --name "Campaign Orchestrator" \
  --session isolated \
  --tz "UTC"

echo "Successfully registered the Campaign Orchestrator cron job with the OpenClaw daemon!"
echo "You can check its status anytime by running: openclaw cron list"
