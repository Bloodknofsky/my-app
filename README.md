# Arman Sykot — Academic Profile & NV-Diamond Research Assistant

A personal academic profile page for Arman Sykot, a quantum sensing researcher, with a chatbot grounded in the lab's core NV-diamond research literature.

## What this is

- **Profile page** — name, title, research focus, and a contact section with a copy-email button. Static content, no login, no database.
- **NV-Diamond Research Assistant** (`/chatbot`) — answers questions about diamond NV-center quantum sensing, grounded in a pre-embedded review paper (Barry et al., "Sensitivity optimization for NV-diamond magnetometry," Rev. Mod. Phys. 92, 015004, 2020). Suggested questions get visitors started; off-topic questions get a polite redirect instead of an attempted answer, and unsupported questions get an honest "the paper doesn't cover it" rather than a guess.

Full requirements and design are documented in [PRD.md](PRD.md), [PLAN.md](PLAN.md), and [DESIGN.md](DESIGN.md) — note these describe the original visitor-upload design; see [CLAUDE.md](CLAUDE.md)'s "Cycle 2 pivot" section for what actually shipped. Project conventions and rules live in [CLAUDE.md](CLAUDE.md).

## Status

The profile page and the NV-diamond research assistant are both functional and deployed. The chatbot's knowledge base is a single pre-embedded paper (built via `scripts/build-corpus.mjs`, not a visitor upload). [CHECK.md](CHECK.md) reflects an earlier point in the build (the original upload-based design) and is due for a fresh gap analysis / security review against the current pivot.

## Stack

- [Next.js](https://nextjs.org/) (App Router) — page and API routes in one project
- TypeScript, Tailwind CSS
- `pdfjs-dist` — used offline by `scripts/build-corpus.mjs` to extract and chunk the source paper; not part of the deployed runtime
- OpenAI `text-embedding-3-small` (embeddings) and `gpt-4o-mini` (chat)
- Deployed on [Vercel](https://vercel.com/)

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env` file with `OPENAI_API_KEY` set (never committed — see `.gitignore`).

## Rebuilding the chatbot's knowledge base

To swap in a different paper (or add more), edit `SOURCE_PDF` (and `SKIP_PAGES` if a front-matter page pollutes retrieval) in `scripts/build-corpus.mjs`, then run:

```bash
node scripts/build-corpus.mjs
```

This calls the OpenAI embeddings API directly (real cost, proportional to document length) and overwrites `data/nv-corpus.json`. Re-run the suggested questions in `/chatbot` afterward — see the "Lessons learned" section in `CLAUDE.md` for known pitfalls (bibliography noise, fixed-size chunking fragility, TOC pages).
