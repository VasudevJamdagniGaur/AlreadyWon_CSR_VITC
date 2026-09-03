# KellyOS

**KellyOS — AI-Powered CSR Decision & Project Intelligence Platform**

KellyOS turns CSR from a fragmented, manual process into a continuous decision-support system — helping companies prioritize the right projects, identify the right implementation partners, allocate limited funds, monitor execution, and use historical performance to make better future decisions.

> Final funding and partner decisions remain with humans. KellyOS is decision-support, not an autonomous financial decision maker.

---

## Problem

CSR teams face three connected challenges:

1. **Fund allocation & prioritization** — many proposals, limited budgets, inconsistent criteria  
2. **NGO–corporate matching** — fragmented partner information across expertise, geography, and reliability  
3. **Lifecycle management** — documents, milestones, spend, and risks spread across tools  

## Solution

**PRIORITIZE → EVALUATE → MATCH → ALLOCATE → MONITOR → LEARN**

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js App Router, React, TypeScript, Tailwind, Recharts |
| Backend | Next.js API routes + service layer |
| Database | **Firebase Firestore** (Admin SDK) |
| Demo fallback | Local JSON document store when Firebase credentials are absent |
| AI | OpenAI-compatible + Demo Analysis fallback |
| Validation | Zod |
| Tests | Vitest |

## Firebase Auth

KellyOS sign-in uses **Firebase Authentication** (email/password).

1. Enable Email/Password in Firebase Console → Authentication  
2. Create user `demo@kellyos.ai` / `demo123` (or register in-app)  
3. Set `NEXT_PUBLIC_FIREBASE_*` in `.env` (see `.env.example`)  
4. `npm run db:seed` then `npm run dev`  

Flow: client `signInWithEmailAndPassword` → ID token → `/api/auth/login` verifies token → app session cookie.

## Setup

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project id (`kellys-b67aa`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app id |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics measurement id |
| `FIREBASE_PROJECT_ID` | Same project id (server) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional inline Admin JSON (prefer PATH) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Admin service-account JSON (server-only) |
| `USE_DEMO_FIRESTORE` | `true` = local JSON store; `false` = live Cloud Firestore |
| `OPENAI_API_KEY` | Optional live AI |
| `AI_MODEL` | Default `gpt-4o-mini` |
| `USE_DEMO_AI` | Force Demo Analysis |
| `NEXT_PUBLIC_APP_NAME` | `KellyOS` |
| `NEXT_PUBLIC_DEMO_MODE` | Shows DEMO MODE badge |
| `UPLOAD_DIR` | Local uploads folder |

Never commit service account keys.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run evaluate
npm run db:test      # read-only Cloud Firestore connectivity check
npm run db:seed      # seed Firestore or local demo store
npm run db:reset     # same as seed (clears then seeds)
```

## Demo account

```
Email:    demo@kellyos.ai
Password: demo123
```

## Core scoring dimensions

Social Impact (30%) · Execution Reliability (20%) · Company Alignment (20%) · Community & Brand Resonance (15%) · Cost & Risk Efficiency (15%)

`S = 0.30(I) + 0.20(R) + 0.20(A) + 0.15(C) + 0.15(E)` — configurable weighted decision model (not the Kelly Criterion).

## Demo flow

1. Sign in → Dashboard  
2. Prioritize → Project Sunrise score breakdown  
3. NGO Matching → Seva Foundation  
4. Fund Allocation → recommended coverage  
5. Monitoring → progress / risk  
6. Settings → scoring weights  

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Limitations

- Demo auth is not enterprise SSO  
- Local uploads by default  
- Demo Firestore mode uses a file store (swap to live Firebase for production)  
- Allocation is recommended, not mathematically guaranteed optimal  

## License

Hackathon prototype — seeded organizations and figures are synthetic.
