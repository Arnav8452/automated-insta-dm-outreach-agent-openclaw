# Periodic Outreach Checks

When a heartbeat triggers, execute the following campaign manager skills:
1. Run `check_waitlist.ts` to see if any influencers accepted follow requests. If any are accepted, draft a message and call `dm_sender.ts`.
2. Run `check_cadence.ts` to find threads due for a follow-up. If any are due, draft a follow-up message and call `dm_sender.ts`.
3. Run `get_active_threads.ts` to fetch threads that are `AWAITING_REPLY`. For each thread, run `check_replies.ts`. If new messages from the INFLUENCER are detected, read them, update the thread status, and NEGOTIATE the budget using `dm_sender.ts` if needed according to your SOUL rules!
