# Automated Instagram DM Outreach Agent (OpenClaw)

This project is a 100% local, production-ready Instagram influencer negotiation engine built on the [OpenClaw framework](https://github.com/openclaw/openclaw). It strictly utilizes local storage (via Dockerized PostgreSQL and Redis) for state separation and runs Playwright locally in headful mode to avoid Meta API bans.

## Architecture
- **State Machine**: PostgreSQL manages the negotiation states (`PENDING`, `AWAITING_REPLY`, `IN_NEGOTIATION`, `WON`, `LOST`).
- **Distributed Locking**: Redis ensures the agent never exceeds Instagram's 20 DMs/hour limit.
- **Hybrid LLM Routing**: Fast intent triage combined with a sophisticated reasoning model for budget-constrained negotiation.
- **Local Execution**: Playwright runs locally on your machine, retaining Instagram authentication cookies to avoid shadowbans.

## Local Setup

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v20+)
- A lightweight LLM API Key (e.g., Groq, OpenAI)

### 2. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your `API_KEY` in the `.env` file. The database and Redis URLs are pre-configured for the local Docker cluster.

### 3. Booting the Infrastructure
Start the local PostgreSQL and Redis databases:
```bash
docker compose up -d
```
The database schema (`campaigns`, `influencers`, `outreach_threads`, `messages`) will automatically migrate on the first boot.

### 4. Running the Agent
Because this agent uses Playwright in headful mode for debugging and captcha-solving, it runs directly on your local machine:
```bash
npm install
npm start
```
Watch the Chromium window open and automate your negotiations safely!
