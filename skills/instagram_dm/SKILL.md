---
name: instagram_dm
description: Automates sending an Instagram DM securely via local Puppeteer browser automation.
---

When you need to send a Direct Message to an Instagram influencer to negotiate a budget or pitch a collaboration, use your native `exec` tool to run the following script:

```bash
npx ts-node scripts/dm_sender.ts "<influencer_handle>" "<message_content>" "<thread_id>"
```

### Important Execution Rules
1. Only run this script when the state of the database thread is `PENDING` or `IN_NEGOTIATION`.
2. Do not use unescaped double quotes inside the `<message_content>` argument if they would break the bash string wrapper.
3. You do NOT need to manually update PostgreSQL. The `dm_sender.ts` script will automatically log the message into the `messages` table and update the `outreach_threads` status to `AWAITING_REPLY` upon success.
4. If the script throws an error mentioning "Action Blocked", gracefully pause the campaign and notify the user that we hit Meta's rate limits.
