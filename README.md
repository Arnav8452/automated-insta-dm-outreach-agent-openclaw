# Automated Instagram DM Outreach Agent (OpenClaw)

This project is a 100% local, production-ready Instagram influencer negotiation engine built natively on the [OpenClaw Framework](https://github.com/openclaw/openclaw). It adheres strictly to core data engineering principles to provide safe, rate-limited, and context-aware DM automation without relying on the official Meta API.

## Core System Features Implemented

1. **Lead Ingestion & Enrichment Pipeline**
   - **Implemented via**: `scripts/ingest_leads.ts`
   - Parses target influencer handles from `leads.csv` and structures their metrics using safe PostgreSQL UPSERT transactions.

2. **State Separation & Management**
   - **Implemented via**: `db/init.sql` & PostgreSQL
   - The state machine strictly governs the workflow (`PENDING`, `AWAITING_REPLY`, `IN_NEGOTIATION`, `WON`, `LOST`). The choice of LLM provider has zero impact on how thread contexts are transactionally managed.

3. **Autonomous Scouting (AI Lead Generation)**
   - **Implemented via**: `skills/influencer_scout/SKILL.md` & `scripts/inject_scouted_lead.ts`
   - Instructs the OpenClaw agent to autonomously hunt for influencers using web search, evaluate them, and inject them into the PostgreSQL pipeline without human intervention.

4. **DM Automation Layer (Native Exec Tool)**
   - **Implemented via**: `scripts/dm_sender.ts`
   - Safely interacts with Instagram's messaging UI natively via **Puppeteer**. It utilizes robust ARIA/text selectors to bypass React obfuscation and retains local cookies to avoid shadowbans.

5. **Multi-Turn Negotiation (Native AgentSkills & Cron)**
   - **Implemented via**: `SOUL.md` (Workspace Persona) & `skills/instagram_dm/SKILL.md` (AgentSkill)
   - Integrated with the native **OpenClaw Cron Scheduler**. The engine automatically wakes up to process leads and uses its built-in `exec` tool to run the Puppeteer automation script autonomously.

---

## Complete Guide: How to Run the Native Engine

### 1. Prerequisites
- **Node.js v22.19+** (Strictly required by the OpenClaw 2026 release).
- **Docker & Docker Compose** (For the Database and Redis locking).
- The official `openclaw` package installed globally or locally.

### 2. Configure Environment Variables
Copy the example environment file and insert your free-tier LLM API keys:
```bash
cp .env.example .env
```

### 3. Boot the Core Infrastructure
Start the local PostgreSQL State Machine and Redis Distributed Lock Manager:
```bash
docker compose up -d
```

### 4. Authenticate Instagram Locally
Because we bypass the official Meta API, you must log into Instagram once so Puppeteer can save your session cookies safely to your hard drive.
```bash
npx ts-node scripts/login.ts
```
*Log into the Chromium window that pops up, then press Ctrl+C in your terminal.*

### 5. Add Target Leads (Two Methods)

**Method A: Targeted Manual Injection (CSV)**
Populate the system with specific targets by editing the `leads.csv` file, then run:
```bash
npx ts-node scripts/ingest_leads.ts leads.csv
```

**Method B: Autonomous AI Scouting**
Simply boot the OpenClaw Daemon (Step 7) and chat with the bot in your terminal or web UI:
> *"Find me 5 fitness influencers with 10k-50k followers and queue them up for outreach."*
The `influencer_scout` skill will autonomously search the web and inject them into the database for you!

### 6. Register the Background Scheduler
Hook into the native OpenClaw Gateway scheduler to wake the agent every 10 minutes:
```bash
./scripts/register_cron.sh
```

### 7. Start the OpenClaw Daemon
Finally, boot the native OpenClaw engine. The daemon will parse your `SOUL.md` persona, read your `SKILL.md` instructions, and autonomously manage the influencer negotiations!
```bash
npm start
```
*(This triggers `npx openclaw gateway run`)*

> [!NOTE]
> **Workspace Configuration:** We have configured the global `openclaw.json` to point its workspace directly to this repository (`D:\openclaw_tool`). This ensures the daemon automatically discovers our custom `SOUL.md` persona and the custom AgentSkills inside the local `skills/` directory when it boots up!

---

## Troubleshooting: Compiling OpenClaw from Source
If `npm install openclaw` fails on your machine due to corporate proxies or Node engine mismatches, you can bypass the registry and build the engine natively from source:

```bash
# 1. Clone the repository natively (bypassing strict proxy SSL)
git -c http.sslVerify=false clone https://github.com/openclaw/openclaw.git repo_clone/openclaw

# 2. Enter the workspace and disable strict-ssl for pnpm
cd repo_clone/openclaw
npm install -g pnpm
pnpm config set strict-ssl false

# 3. Build the core Gateway engine
pnpm install
pnpm openclaw setup
pnpm build
```
*(Note: the `repo_clone/` directory is automatically ignored by git via `.gitignore`).*
