# DESIGN — Arman Sykot profile site

Source: [PLAN.md](PLAN.md), [PRD.md](PRD.md)

## Screen layout

### `/` — Profile page

```
┌─────────────────────────────────────┐
│ Header: name, title                  │
├─────────────────────────────────────┤
│ Hero: research focus intro           │
├─────────────────────────────────────┤
│ Contact section: email + copy button │
│ Link → "RAG Chatbot"                 │
└─────────────────────────────────────┘
```
All static text except the copy-email button — content limited to name, title, research focus, and contact, matching PRD §5-1 exactly (no photo; PRD doesn't list one, and adding one would pull in an alt-text requirement PRD never asked for). Single column, stacks the same way at every width from 320px to 1920px (no sidebar/grid that could break on mobile).

Copy-email button behavior (undefined in PRD, defined here): on click, copy the address and show "Copied!" next to the button for ~2 seconds, then revert. If the clipboard API fails, fall back to showing the email as plain selectable text so the visitor can still copy it manually.

### `/chatbot` — RAG chatbot page

```
┌─────────────────────────────────────┐
│ ← Back to profile                    │
├─────────────────────────────────────┤
│ Upload area                          │
│  - "Choose PDF" control              │
│  - current file name / replace warn  │
├─────────────────────────────────────┤
│ Chat window                          │
│  - message list (visitor / bot)      │
│  - loading indicator while answering │
│  - input box + send button           │
└─────────────────────────────────────┘
```
A link back to `/` keeps PRD's documented flow ("...visitor emails Arman directly if they need more") reachable from the chatbot page. Upload area sits above the chat window; the chat window is disabled/empty until a PDF has been successfully processed (a UX default we're choosing, not a PRD rule).

## Data flow

### Upload path (input → processing)

```
Visitor selects PDF
  → client checks it's a .pdf (fail → "Only PDF files are supported.", stop)
  → client checks it's ≤10MB (fail → clear size-limit message of our choosing, stop —
      PRD requires rejecting or capping; we reject, matching CLAUDE.md)
  → pdfjs-dist extracts text in the browser — three distinct outcomes, each its own message
      (fails to open at all → "This PDF is password-protected or corrupted — try a different file.", stop)
      (opens, but throws partway through extraction → "This PDF couldn't be processed —
          try a different file.", stop — PRD rule 4's generic "any parsing failure needs a
          specific message," for the case neither of PRD's two named strings covers)
      (opens and extracts cleanly, but yields no text → "This PDF has no readable text —
          try a different file.", stop)
  → text is split into fixed 800-character chunks, no overlap
  → chunks sent to POST /api/embed
  → /api/embed calls OpenAI (text-embedding-3-small, dimensions: 512 — reduced from the
      1536 default to keep per-chunk vectors small), returns one vector per chunk
      (OpenAI timeout/rate-limit here → "Something went wrong (<reason>)", stop — PRD rule 9
      covers any OpenAI call, not just chat)
  → chunks + vectors kept in memory only (React state) — nothing written to disk/DB
```

### Question path (input → processing → output)

```
Visitor types a question, hits send
  → question sent to POST /api/chat along with the in-memory chunks+vectors
  → /api/chat embeds the question (same model, same 512 dimensions — must match the
      embed call exactly, or cosine similarity breaks silently)
  → cosine similarity ranks all chunks; only the top 5 are kept as context
  → gpt-4o-mini answers using ONLY those 5 chunks
      → if the chunks don't support an answer: bot replies with a clear "I'm not sure —
          the document doesn't cover that" style answer (PRD fixes the behavior; the exact
          wording is our choice, not a fixed PRD string)
      → if OpenAI times out / rate-limits: "Something went wrong (<reason>)", no auto-retry
  → a single complete answer is returned (no streaming) and appended to the message list
```

Replacing the PDF while one is already loaded interrupts this flow with a confirm step using PRD's exact string — "Uploading a new PDF will replace the current document and clear the chat." — then on confirm, clears old chunks/vectors/messages and restarts the upload path.

### API contract

Both routes return JSON. On any handled failure (bad OpenAI response, timeout, rate-limit), the response is `{ "error": "<message>" }` where `<message>` is one of PRD's exact strings if it's one of the four fixed cases, or `Something went wrong (<reason>)` otherwise — this is the field the UI reads to show the real reason, per PRD rule 9.

- `POST /api/embed` — request: `{ chunks: string[] }`. Success response: `{ vectors: number[][] }`, one 512-length vector per input chunk, same order.
- `POST /api/chat` — request: `{ question: string, chunks: string[], vectors: number[][] }`. Success response: `{ answer: string }`. Deliberately no client-supplied `role`/`history` field — a known bug in an earlier prototype of this feature accepted an unchecked `role` value from the client, letting a request inject a fake `"system"` message that overrode the grounding instructions. If multi-turn chat history is ever added to this contract, the server must whitelist each message's role to exactly `"user"` or `"assistant"` at runtime (a TypeScript type alone doesn't enforce this) — never trust a client-supplied role as-is.

### Scale note (30-second target)

Every question re-sends the full set of in-memory chunks+vectors to `/api/chat`, since there's no backend store (PRD rule 10). For a single academic PDF under the 10MB file cap, extracted text is typically well under a few hundred KB — a few hundred chunks at most — so the request body and round-trip stay small enough to comfortably fit the 30-second target on their own terms, independent of any specific hosting platform's limits. Reduced embedding dimensions (512, above) keep each chunk's vector small for the same reason. If this were ever used with much larger documents, chunk/vector storage would need to move server-side — out of scope here.

## Tech choices

Base is fixed: **Next.js (App Router)**, one project for both the page and the API. **Vercel** is the target deployment platform for Part 5 — PRD mentions it as the next step, not as part of this cycle's scope, so nothing here should assume it's live yet.

On top of that base, here's what's needed and why, in plain terms:

- **pdfjs-dist** — a library that reads a PDF's text *inside the visitor's browser*, so we never have to upload the raw file to a server just to read it.
- **OpenAI API (`text-embedding-3-small` + `gpt-4o-mini`)** — the service that turns text into searchable "meaning vectors" and that writes the actual chat answers.
- **Tailwind CSS** — a styling toolkit that lets us build the look (spacing, colors, responsive layout) quickly without writing custom CSS files for every element.
- **TypeScript** — a stricter version of JavaScript that catches typos and mismatched data early, before they become a bug a visitor sees.
- **React state (in-memory only)** — instead of a database, the uploaded document and chat just live in the browser tab's memory; closing or refreshing the page clears them, matching the PRD's "no persistence" rule.

No database, no auth provider, and no separate backend server are needed — Next.js's own API routes are enough to talk to OpenAI.

## Security & accessibility notes

- `OPENAI_API_KEY` is read only inside `/api/embed` and `/api/chat` (server-side code). It must never be passed into client components, `NEXT_PUBLIC_*` env vars, or logged/printed anywhere. `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, and `VERCEL_TOKEN` (PRD §7) aren't used by the app itself — they're for tooling/deployment — but the same rule applies: read from `.env` only, never printed or logged. All four live only in `.env`, which stays listed in `.gitignore` and is never committed (PRD §7, CLAUDE.md).
- Both pages meet a baseline accessibility bar: semantic HTML elements, alt text on any image, keyboard-operable controls (upload button, send button, copy-email button), and sufficient color contrast against the blue/white palette. Not a full WCAG audit — see PRD §6.
- Non-English PDFs or questions (PRD §6, out of scope) get no special handling or detection — the app simply processes whatever text pdfjs-dist extracts and whatever question is typed, with no guarantee of quality outside English.
