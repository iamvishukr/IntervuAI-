# IntervuAI — Walk in ready.

An AI-powered interview preparation platform. Paste a job description and upload your resume (PDF, Word, or text — drag & drop), take a realistic mock interview with an AI interviewer whose responses stream in live, then get an honest, scored performance report.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Gemini API (streaming) — free tier, no credit card**.

## Features

- **Resume upload with drag & drop** — drop a PDF, .docx, or .txt and the text is extracted server-side (with a paste fallback and an editable preview of what was read).
- **Reliable structured output** — question generation and feedback use Gemini's JSON mode (`responseMimeType` + `responseSchema`) with thinking disabled and automatic retry, eliminating malformed-JSON failures.
- **Polished motion design** — orchestrated stage transitions (Framer Motion), a live-typing hero cue card, streaming cursor and typing indicator in the interview, and an animated count-up score ring on the report.
- **Tailored question generation** — the AI reads both the job description and your resume, then builds 6 questions targeting your actual experience, including a probe on any gap it spots between the two.
- **100% free to run** — powered by the Gemini API free tier (no credit card, no subscription).
- **Realistic streaming mock interview** — a conversational interviewer ("Alex") asks one question at a time, reacts to your answers, and follows up when you're vague. Responses stream token-by-token via the Gemini streaming API.
- **Honest scorecard** — end the session for a 0–100 score across Communication, Technical depth, STAR structure, and Role fit, plus specific strengths and actionable improvements.
- **Zero database, zero auth** — stateless by design. Nothing you paste is stored anywhere.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Add your FREE API key

Get a free Gemini API key (no credit card required):

1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account
3. Click **Create API key** and copy it

Then:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
GEMINI_API_KEY=AIza...
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at https://vercel.com/new — Vercel auto-detects Next.js; no config needed.
3. In the project's **Settings → Environment Variables**, add `GEMINI_API_KEY`.
4. Deploy. Done.

> Note: interview responses stream, so they work well within serverless limits. `maxDuration` is set to 60s on all API routes.

## Architecture

```
app/
├── page.tsx                     # Landing page
├── prep/page.tsx                # Interview flow (setup → live chat → scorecard)
└── api/
    ├── parse-resume/            # POST — PDF/DOCX/TXT upload → extracted text
    ├── generate-questions/      # POST — JD + resume → 6 tailored questions (JSON)
    ├── interview/               # POST — chat history → streamed interviewer reply
    └── feedback/                # POST — transcript → scored feedback (JSON)
lib/
├── gemini.ts                    # Client factory, model config, safe JSON parsing
└── types.ts                     # Shared types
```

**Design decisions worth knowing:**

- **Streaming over polling** — `/api/interview` returns a `ReadableStream`; the client renders tokens as they arrive for a real-conversation feel.
- **Model output as JSON contracts** — question generation and feedback both instruct the model to return JSON only, parsed defensively (`parseModelJson`) against markdown fences and stray text.
- **Stateless sessions** — all interview state lives in React state on the client; the full message history is sent with each turn. No database, no PII retention.
- **Model configurable via env** — defaults to `gemini-2.5-flash` (free tier); override with `GEMINI_MODEL`.

## Environment variables

| Variable         | Required | Description                                     |
| ---------------- | -------- | ----------------------------------------------- |
| `GEMINI_API_KEY` | Yes      | Your free Gemini API key from Google AI Studio  |
| `GEMINI_MODEL`   | No       | Model override (default: `gemini-2.5-flash`)    |

## License

MIT
