---
name: influencer_scout
description: Autonomously scouts the web for Instagram influencers and injects them into the outreach pipeline.
---

When the user asks you to find, scout, or queue up influencers for a specific niche, follow this strict protocol:

### Step 1: Scout
Use your native `web_search` tool to discover active Instagram accounts. 
**PRO TIP for Web Search:** 
- If third-party listicles (like Feedspot) block you with Cloudflare `403` errors, DO NOT STOP! 
- Instead, use DuckDuckGo queries targeted directly at Instagram profiles, e.g., `site:instagram.com "fitness coach" "10k followers"` or simply extract handles and follower counts directly from the DuckDuckGo snippets rather than trying to fetch the full web pages!

### Step 2: Extract
Identify the precise Instagram handle, their core niche, and estimate their follower count from the search results or snippets.

### Step 3: Inject
For every valid influencer handle you find, use your native `exec` tool to run the injection script:
```bash
npx ts-node scripts/inject_scouted_lead.ts "<handle>" "<niche>" "<estimated_followers>"
```

### Important Rules
1. Do not include the `@` symbol in the `<handle>` argument.
2. The injection script will safely handle duplicates natively in PostgreSQL. You do not need to query the database manually before injecting.
3. Once injected, the autonomous Cron Job (`Campaign Orchestrator`) will automatically detect the new `PENDING` threads and take over the DM automation. You do not need to send the messages yourself during the scouting phase.
4. **Resilience**: If a website blocks you, do not apologize and stop. Try another link, or extract the data purely from the search engine snippets!
