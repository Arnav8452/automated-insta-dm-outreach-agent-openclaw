---
name: influencer_scout
description: Autonomously scouts the web for Instagram influencers and injects them into the outreach pipeline.
---

When the user asks you to find, scout, or queue up influencers for a specific niche, follow this strict protocol:

### Step 1: Scout (Reasoning & Acting)
*   **Action:** Use the `web_search` tool to search for lists, articles, or directories of top Instagram influencers in the user's requested niche.
*   **Alternative:** ONLY IF you specifically need to bypass Instagram's login wall to search directly, use your `Exec` tool to run: `powershell -Command "npx ts-node scripts/scout_instagram.ts '<niche>'"`

### Step 2: Extract (Reasoning & Acting)
*   **Action:** Use the `web_fetch` tool to read the contents of the URLs you found in Step 1. Ensure you pass the parameters `mode: "text"` and limit it to roughly `max: 5000` characters if the tool supports it to avoid context limits.
*   **Reasoning:** Analyze the text to identify the exact Instagram handle, niche, and estimated follower count of each influencer. Do NOT try to run any local scripts for this step.

### Step 3: Inject (Reasoning & Acting)
*   **Action:** For every valid influencer handle you extracted, use your `Exec` tool to run the injection script.
*   **Command:** `powershell -Command "npx ts-node scripts/inject_scouted_lead.ts '<handle>' '<niche>' '<followers>'"`

### Important Rules
1. Do not include the `@` symbol in the `<handle>` argument when injecting.
2. The injection script safely handles duplicates natively in PostgreSQL. You do not need to check the database manually first.
3. Once injected, the autonomous `Campaign Orchestrator` cron job automatically detects `PENDING` threads and starts DM automation. Do not send messages yourself.
4. **DO NOT** attempt to set environment variables (like `DATABASE_URL`) in your `Exec` command. Just run the exact raw command provided.
