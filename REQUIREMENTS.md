# OpenClaw Ecosystem & Required Stack

This document serves as the permanent reference for the core architectural components that must be utilized in this project. Any future development, architectural decisions, or code modifications must align with this stack.

1. **Core Framework (`openclaw/openclaw`)**: 
   The core gateway daemon that handles connections to LLMs and manages multi-turn session memory.

2. **Agent Templates (`mergisi/awesome-openclaw-agents`)**: 
   We will use the "Influencer Scout" agent template (SOUL.md config) as our baseline to evaluate influencers and inject budget negotiation logic.

3. **Campaign Management (`VoltAgent/awesome-openclaw-skills`)**: 
   We will adapt existing outreach skills to manage campaign tracking and reply monitoring.

4. **DM Adapter Layer (`alanalyzing/influencer-dm-extension`)**: 
   We will wrap this 100% local browser automation module into a custom OpenClaw skill to handle bulk outreach and cadence follow-ups safely without Meta API keys.

## Core System Features Needed

1. **Lead Ingestion & Enrichment Pipeline**: 
   A robust data layer to feed target influencer handles into the system and structure their metrics before outreach.

2. **State Separation & Management**: 
   A PostgreSQL schema to manage the state machine (Pending, Awaiting Reply, In Negotiation, Won, Lost). The choice of LLM provider must have zero impact on how thread contexts and campaign states are transactionally managed.

3. **DM Automation Layer**: 
   Safely interacting with Instagram's messaging system via the local browser automation adapter.

4. **Multi-Turn Negotiation**: 
   The agent needs context retention for each specific DM thread.

## Technical Constraints & Requirements

- **API Agnosticism & Hybrid Routing**: 
  The system must not be dependent on local LLMs. It should utilize a lightweight, high-speed cloud API (e.g., OpenAI, Groq) for basic intent classification and swap to a sophisticated reasoning model for complex financial negotiations.

- **Budget Logic**: 
  The AI agent must be strictly constrained to negotiate rates. It needs to calculate when a quote is too high, execute counter-offers, and know when to walk away.

- **Data Infrastructure Focus**: 
  The architecture must prioritize the underlying data pipelines. We need robust transactional state management and distributed rate-limiting to prevent duplicate messaging, account bans, or exceeding budgets.
