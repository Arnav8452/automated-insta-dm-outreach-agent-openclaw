---
name: influencer_scout
description: Autonomously scouts the web for Instagram influencers and injects them into the outreach pipeline.
---

When the user asks you to find, scout, or queue up influencers for a specific niche, follow this strict protocol:

### Step 1: Scout using the ReAct Tool
Use your native `exec` tool to run the internal Instagram scout script. This tool leverages the user's authenticated Puppeteer session to bypass Cloudflare and directly query Instagram's search API.
```bash
npx ts-node scripts/scout_instagram.ts "<niche>"
```
The script will return a JSON list of users matching the niche.

### Step 2: Review Results
Review the JSON array of influencers. Identify their exact handles and their follower counts from the output.

### Step 3: Inject
For every valid influencer handle you find, use your native `exec` tool to run the injection script:
```bash
npx ts-node scripts/inject_scouted_lead.ts "<handle>" "<niche>" "<followers>"
```

### Important Rules
1. Do not include the `@` symbol in the `<handle>` argument when injecting.
2. The injection script will safely handle duplicates natively in PostgreSQL. You do not need to query the database manually before injecting.
3. Once injected, the autonomous Cron Job (`Campaign Orchestrator`) will automatically detect the new `PENDING` threads and take over the DM automation. You do not need to send the messages yourself during the scouting phase.
