# Automated Instagram DM Outreach Agent (OpenClaw)

This project is a 100% local, production-ready Instagram influencer negotiation engine built on the [OpenClaw framework](https://github.com/openclaw/openclaw). It adheres strictly to core data engineering principles to provide safe, rate-limited, and context-aware DM automation without relying on the official Meta API.

## Core System Features Implemented

1. **Lead Ingestion & Enrichment Pipeline**
   - **Implemented via**: `scripts/ingest_leads.ts`
   - A robust data layer that parses target influencer handles from `leads.csv` and structures their metrics using safe PostgreSQL UPSERT transactions.

2. **State Separation & Management**
   - **Implemented via**: `db/init.sql` & PostgreSQL
   - The state machine strictly governs the workflow (`PENDING`, `AWAITING_REPLY`, `IN_NEGOTIATION`, `WON`, `LOST`). The choice of LLM provider has absolutely zero impact on how thread contexts and campaigns are transactionally managed.

3. **DM Automation Layer**
   - **Implemented via**: `skills/instagram_dm/SKILL.md`
   - Safely interacts with Instagram's messaging UI natively via **Puppeteer**. It utilizes robust ARIA/text selectors to bypass React obfuscation and retains local cookies to avoid shadowbans.

4. **Multi-Turn Negotiation**
   - **Implemented via**: `agents/influencer_scout/SOUL.md` & `messages` table
   - Context retention is hardcoded into the database. The agent maintains deep memory of budget constraints and negotiation history across the lifecycle of the DM thread.

---

## Complete Guide: How to Use This With OpenClaw

### 1. Prerequisites
- **Docker & Docker Compose** (For the Database and Redis locking).
- **Node.js v20+** (For the OpenClaw daemon and Puppeteer).
- A valid free-tier API Key for the LLM routing (Groq, Google Gemini, OpenRouter, etc.).

### 2. Configure Environment Variables
Copy the example environment file and insert your API keys:
```bash
cp .env.example .env
```
Update `.env` with your API keys. The PostgreSQL and Redis URLs are pre-configured to connect to your local Docker containers.

### 3. Boot the Core Infrastructure
Start the local PostgreSQL State Machine and Redis Distributed Lock Manager:
```bash
docker compose up -d
```
*Note: The database schema (`campaigns`, `influencers`, `outreach_threads`, `messages`) will automatically migrate on the first boot.*

### 4. Ingest Target Leads
Populate the system with target Instagram handles by editing the `leads.csv` file, then run the ingestion pipeline:
```bash
npm install
npx ts-node scripts/ingest_leads.ts leads.csv
```
*This will safely lock your leads into the database with a `PENDING` state.*

### 5. Start the OpenClaw Daemon
Finally, start the main gateway daemon. This triggers the `src/index.ts` script, which loads your Heartbeats, registers the Puppeteer DM Skill, and begins querying the database for the `PENDING` threads.
```bash
npm start
```

Watch the native Chromium window pop open automatically and seamlessly automate your influencer negotiations!
