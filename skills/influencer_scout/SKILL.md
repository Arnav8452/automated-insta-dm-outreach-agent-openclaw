---
name: influencer_scout
description: Autonomously scouts the web for Instagram influencers and injects them into the outreach pipeline.
---

When the user asks you to find, scout, or queue up influencers for a specific niche, follow this strict protocol:

### Step 1: Scout (Reasoning & Acting)
*   **Action:** Use the `web_search` tool to search for lists, articles, or directories of top Instagram influencers in the user's requested niche.
*   **Alternative:** ONLY IF you specifically need to bypass Instagram's login wall to search directly, use your `Exec` tool to run: `powershell -Command "node dist/scripts/scout_instagram.js '<niche>'"`

### Step 2: Extract & Enrich (Reasoning & Acting)
*   **Action:** Use the `web_fetch` tool to read the contents of the URLs you found in Step 1. Ensure you pass the parameters `mode: "text"` and limit it to roughly `max: 5000` characters if the tool supports it to avoid context limits.
*   **Reasoning:** Analyze the text to identify the following details for each influencer:
    *   **handle:** The exact Instagram handle (no '@' symbol).
    *   **followers:** Estimated follower count.
    *   **bio:** The influencer's bio text.
    *   **profile_url:** The full Instagram URL.
    *   **language:** Primary language of content.
    *   **geography:** Inferred location.
    *   **lead_score:** A score out of 100 based on niche match, engagement rate proxy, and fake follower risk.
    *   **brand_fit_notes:** Why this influencer is a good fit.
    *   **niche:** The specific sub-niche.
    Do NOT try to run any local scripts for this step.

### Step 3: Inject (Reasoning & Acting)
*   **Action:** For every valid influencer handle you extracted and enriched, use your `Exec` tool to run the injection script. You MUST pass the enriched data as a single minified JSON string for the second argument.
*   **Command:** `powershell -Command "node dist/scripts/inject_scouted_lead.js '<handle>' '{\"followers\": \"<followers>\", \"bio\": \"<bio>\", \"profile_url\": \"<profile_url>\", \"language\": \"<language>\", \"geography\": \"<geography>\", \"lead_score\": \"<lead_score>\", \"brand_fit_notes\": \"<brand_fit_notes>\", \"niche\": \"<niche>\"}'"`

### Important Rules
1. Do not include the `@` symbol in the `<handle>` argument when injecting.
2. The injection script safely handles duplicates natively in PostgreSQL. You do not need to check the database manually first.
3. Once injected, the autonomous `Campaign Orchestrator` cron job automatically detects `PENDING` threads and starts DM automation. Do not send messages yourself.
4. **DO NOT** attempt to set environment variables (like `DATABASE_URL`) in your `Exec` command. Just run the exact raw command provided.
