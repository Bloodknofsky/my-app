# Arman Sykot — Academic Profile & RAG Chatbot

A personal academic profile page for Arman Sykot, a quantum sensing researcher, with a PDF-grounded RAG (Retrieval-Augmented Generation) chatbot built in.

## What this is

- **Profile page** — name, title, research focus, and a contact section with a copy-email button. Static content, no login, no database.
- **RAG chatbot** (`/chatbot`) — a visitor uploads a PDF, the app extracts and chunks its text client-side, embeds the chunks, and answers questions grounded only in that document. If a question isn't answerable from the document, the bot says so instead of guessing.

Full requirements and design are documented in [PRD.md](PRD.md), [PLAN.md](PLAN.md), and [DESIGN.md](DESIGN.md). Project conventions and rules live in [CLAUDE.md](CLAUDE.md).

## Status

Built incrementally as a PDCA (Plan–Design–Do–Check–Act) exercise. Currently implemented: the profile page, its styling, and the copy-email interaction. The chatbot route exists as a placeholder — PDF upload, text extraction, chunking, embedding, and the chat UI are still in progress (see [PLAN.md](PLAN.md) for the full task list and [CHECK.md](CHECK.md) for the latest verification results).

## Stack

- [Next.js](https://nextjs.org/) (App Router) — page and API routes in one project
- TypeScript, Tailwind CSS
- `pdfjs-dist` for client-side PDF text extraction
- OpenAI `text-embedding-3-small` (embeddings) and `gpt-4o-mini` (chat)
- Deployed on [Vercel](https://vercel.com/)

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env` file with `OPENAI_API_KEY` set (never committed — see `.gitignore`).
