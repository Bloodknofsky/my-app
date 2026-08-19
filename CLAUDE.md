# Project rulebook — Arman Sykot profile site

Personal academic profile page for a quantum sensing researcher, with a PDF RAG chatbot for document Q&A. Full context: [PRD.md](PRD.md), [prd_lite.md](prd_lite.md).

## Stack (fixed — do not swap)

- Next.js (App Router) for both the page and the API routes — fixed by the PRD decision. Never switch to another framework or suggest migrating.
- TypeScript and Tailwind CSS — added on top of the Next.js base per DESIGN.md's tech choices (not a PRD requirement, but a locked project decision now).
- PDF text extraction: `pdfjs-dist`, client-side.
- Embedding model: `text-embedding-3-small`.
- Chat completion model: `gpt-4o-mini`.
- Deployment: Vercel. **The Vercel project's Root Directory must be set to `my-app`, never the repo root.** The repo root (`hello-page/`) still holds an older, standalone `/api/chat` + `/api/embed` implementation with no auth and no rate limit — deploying with the wrong root ships that instead of this project and lets anyone spend the OpenAI key's credits.
- No database, no auth, no persistence layer.

## Working agreement

- Write all explanations, comments, and commit/PR text in English.
- Only create new files inside the `my-app` folder — never write outside it.
- Follow the verification loop below for every change (see "Workflow (verification loop)").
- Never delete a file outright. Move it to a `trash/` folder inside `my-app` instead, for manual review and later deletion.
- Register secret files (`.env`) and `node_modules` in `.gitignore`, and never commit them.
- Never ask for or print a secret/token in chat. Read the needed value directly from `.env`.
  - Supabase work → install the Supabase CLI and authenticate with `SUPABASE_ACCESS_TOKEN` from `.env`.
  - Vercel work (deploys, etc.) → install the Vercel CLI and authenticate with `VERCEL_TOKEN` from `.env`.
- Use the already-installed subagents whenever a task matches what they're for.

## Workflow (verification loop)

Repeat this loop for every change, no matter how small:

1. Make the change.
2. Check the result yourself — open it in a browser or run it. Don't assume it works.
3. Review your own code — re-read the diff for bugs, leftover debug code, and rule violations from this file.
4. If there's a problem, fix it and go back to step 1.
5. Once it passes, summarize in one line what you changed and why.

## Lessons learned (Cycle 1)

- Never rely on OS/browser default dark-mode colors — pin `color-scheme: light` plus explicit background/text colors on every page, and confirm with an actual screenshot, not just a code read. This caused a near-invisible-text bug twice (the Part 3 `test.html` exercise and the Next.js scaffold's default `globals.css`).
- When a scaffolding tool would overwrite existing project files (e.g. `create-next-app` generating its own `CLAUDE.md`/`.gitignore`), run it in a scratch directory first and copy over only the files actually needed — never run it in place.
- A CHECK.md item that requires action on an external account (billing caps, deploy-platform env vars) can't be closed with a code change — write the requirement into CLAUDE.md/DESIGN.md as a durable rule, and mark it fixed only once the user confirms they did it themselves.

## Feature 1 — Profile page

- Static content only, except the copy-email button. No login, no database.
- Must render with no layout breakage from 320px to 1920px viewport width.

## Feature 2 — RAG chatbot

Visitor uploads a PDF; the app extracts/chunks/embeds text and answers questions grounded in it.

- Chunk size fixed at 800 characters. Retrieve only the top 5 most similar chunks (cosine similarity) as context — never more.
- Reject PDF uploads over 10MB with a clear error message.
- Reject non-PDF uploads client-side with exactly: `Only PDF files are supported.`
- If extraction yields no readable text (scanned/image-only PDF): `This PDF has no readable text — try a different file.` OCR is out of scope.
- If the PDF fails to open (password-protected or corrupted): `This PDF is password-protected or corrupted — try a different file.` Password entry is out of scope.
- If a document is already loaded and the visitor uploads another, warn first — `Uploading a new PDF will replace the current document and clear the chat.` — before replacing. Never mix chunks from two documents.
- If an answer isn't supported by the retrieved chunks, the bot must say it doesn't know — never guess.
- Any PDF parsing failure must show a specific, user-facing error — never fail silently.
- If the OpenAI call times out or hits a rate limit, show `Something went wrong (<reason>)` with the real reason. No automatic retry.
- Document and chat state live only in memory. A page refresh resets both — no sessionStorage/localStorage/backend persistence.

## Out of scope — do not build

- User accounts/login.
- Multi-document library (one PDF at a time, unsaved).
- Persistent chat history across sessions.
- Admin/analytics dashboard.
- Upload/question rate limiting.
- Non-English PDFs or questions.

## Accessibility bar

Semantic HTML, alt text, keyboard-operable controls, sufficient color contrast. Not a full WCAG audit.

## Security & secrets

- Uploaded documents are the researcher's own already-published papers — public, non-confidential. Never assume otherwise; don't add handling for private/personal data.
- Secrets (`OPENAI_API_KEY`, `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`) live only in `.env`, which is gitignored. Never print, log, or echo their values.
- When configuring the deployed Vercel project's environment variables, set **only `OPENAI_API_KEY`** (ideally a key dedicated to this project). `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, and `VERCEL_TOKEN` are for local CLI tooling only and must never be added to the app's runtime environment — a `VERCEL_TOKEN` living inside its own public app is self-escalating (any future leak lets an attacker redeploy the site).

## Design

- Mood: clean, minimal, academic/professional.
- Primary color: Korea University blue.
- Mobile-first responsive; no horizontal scrolling at any supported width.
