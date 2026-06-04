---
name: influencer_scout
description: Autonomously scouts the web for Instagram influencers and injects them into the outreach pipeline.
---

When the user asks you to find, scout, or queue up influencers for a specific niche, follow this strict protocol:

### Step 1: Scout using Web/Browser Tools
Use your native `web_search` or `browser` tools to hunt for Instagram accounts that match the user's requested niche. Do NOT try to run a local terminal command for this step. Use your internet access to find lists, articles, or direct Instagram profiles of influencers that fit the criteria.

### Step 2: Extract
From your search results, pull out the influencer's exact Instagram handle, their specific niche, and their estimated follower count. Ensure the handle is accurate.

### Step 3: Inject
For every valid influencer handle you find, run the following local command to execute the injection script:
```bash
npx ts-node scripts/inject_scouted_lead.ts "<handle>" "<niche>" "<followers>"
```

### Important Rules
1. Do not include the `@` symbol in the `<handle>` argument when injecting.
2. The injection script will safely handle duplicates natively in PostgreSQL. You do not need to query the database manually before injecting.
3. Once injected, the autonomous Cron Job (`Campaign Orchestrator`) will automatically detect the new `PENDING` threads and take over the DM automation. You do not need to send the messages yourself during the scouting phase.
4. **DO NOT** attempt to set or pass environment variables (like `DATABASE_URL`) in your command. The scripts are hardcoded to correctly fall back to the local database when running natively. Just run the exact raw command provided.
