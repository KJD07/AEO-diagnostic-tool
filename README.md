# ⚡ AEO Diagnostic — AI Brand Visibility Scanner

> Query GPT-4o, Claude Sonnet, and Gemini Flash simultaneously. Get a report card showing how your brand ranks vs competitors across all three AI engines.

![AEO Diagnostic](https://img.shields.io/badge/AEO-Diagnostic-00e5ff?style=flat-square) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker) ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)

---

## What It Does

1. **You enter** a search query (e.g. "best magnesium supplement for seniors"), your brand name, and up to 4 competitors
2. **The app fires** simultaneous requests to GPT-4o, Claude Sonnet, and Gemini Flash
3. **Claude analyzes** all three responses — extracting brand mentions, rank positions, and sentiment
4. **You get** a full AEO report card with:
   - Per-engine breakdown (who mentioned you, at what rank, with what sentiment)
   - AEO score 0–100 per brand
   - Leaderboard vs. competitors
   - Raw AI responses
   - Actionable improvement tips

---

## Quick Start

### 1. Clone & Configure

```bash
git clone <your-repo>
cd aeo-diagnostic
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### 2. Run with Docker

```bash
docker-compose up --build
```

That's it. Open **http://localhost:3000** in your browser.

---

## Getting API Keys

| Engine | Where to get it |
|--------|----------------|
| OpenAI (GPT-4o) | https://platform.openai.com/api-keys |
| Anthropic (Claude) | https://console.anthropic.com/ |
| Google (Gemini) | https://aistudio.google.com/app/apikey |

All three offer free tiers or trial credits.

---

## Architecture

```
aeo-diagnostic/
├── docker-compose.yml          # Orchestrates frontend + backend
├── .env.example                # API key template
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Express server + SSE streaming
│       └── diagnostic.js       # Core logic: query 3 AIs + Claude analysis
│
└── frontend/
    ├── Dockerfile              # Multi-stage: Vite build → nginx
    ├── nginx.conf              # Reverse proxy to backend
    ├── vite.config.js
    └── src/
        ├── App.jsx             # State machine: idle → running → done
        ├── components/
        │   ├── DiagnosticForm.jsx   # Query input + examples
        │   ├── ProgressPanel.jsx    # Live SSE progress + response preview
        │   └── ReportCard.jsx       # Full report dashboard
        └── index.css
```

### How the Backend Works

```
User Query
    │
    ├──► GPT-4o ────────────────────────────────┐
    ├──► Claude Sonnet ──────────────────────── ├──► Claude Analysis ──► Report JSON
    └──► Gemini Flash ───────────────────────────┘
         (all 3 in parallel via Promise.allSettled)
```

- **Parallel queries**: All 3 engines are queried simultaneously using `Promise.allSettled` — no waiting in sequence
- **SSE streaming**: Progress updates stream to the frontend in real-time as each step completes
- **Analysis**: A second Claude call parses all three responses and returns structured JSON with scores
- **Graceful errors**: If one engine fails (bad API key, rate limit), the others still run

### Frontend Stack

- **React 18** with hooks — no Redux, no router, just useState
- **Vite** for fast dev builds
- **Server-Sent Events** via `fetch` + `ReadableStream` for live progress
- **Nginx** serves the built React app and proxies `/api` to the backend

---

## Development (without Docker)

### Backend
```bash
cd backend
npm install
cp ../.env.example .env  # fill in keys
node src/index.js
# Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Proxies /api to localhost:3001
```

---

## Example Queries to Try

- `best magnesium supplement for seniors` → track Nature Made vs NOW Foods vs Thorne
- `best project management software for small teams` → track Asana vs Monday.com vs Notion
- `best noise cancelling headphones under $300` → track Sony vs Bose vs Apple
- `best CRM for startups` → track HubSpot vs Salesforce vs Pipedrive
- `best coffee subscription service` → track Trade vs Atlas vs Onyx

---

## AEO Score Calculation

| Factor | Weight | How it's measured |
|--------|--------|-------------------|
| Mention Rate | 40% | % of 3 engines that mentioned the brand |
| Rank Position | 35% | Average position when mentioned (lower = better) |
| Sentiment | 25% | Positive/neutral/negative across engines |

Score 0–100. **70+** = strong AEO visibility. **40–70** = moderate. **<40** = needs work.

---

## License

MIT
