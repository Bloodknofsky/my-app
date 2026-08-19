# Project rulebook — Arman Sykot profile site

Personal academic profile page for a quantum sensing researcher, with an NV-diamond research assistant chatbot. Original planning context (visitor-upload chatbot, since superseded — see "Cycle 2 pivot" below): [PRD.md](PRD.md), [prd_lite.md](prd_lite.md).

## Cycle 2 pivot — fixed research corpus, not visitor uploads

The chatbot no longer accepts visitor-uploaded PDFs. It's pre-loaded with one paper — Barry et al., "Sensitivity optimization for NV-diamond magnetometry," Rev. Mod. Phys. 92, 015004 (2020) — embedded once via `scripts/build-corpus.mjs` into `data/nv-corpus.json` (chunks + 512-dim vectors, read server-side by `/api/chat`, never sent to the client). This supersedes PRD's "visitor uploads a PDF" flow and the "multi-document library" out-of-scope item below (moot — there's one fixed document, not visitor-managed ones). `/api/embed` was removed (no runtime caller left) and moved to `trash/`. Rebuilding for a different or additional paper: edit `SOURCE_PDF` (and `SKIP_PAGES` if needed) in `scripts/build-corpus.mjs` and rerun it.

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
- **`vercel deploy` does NOT honor `.gitignore`** — it uploaded the real `.env` on the first deploy despite `.gitignore` listing it. A `.vercelignore` is required separately, and must be verified with `vercel deploy --dry --json` (checking the actual `files` list) before trusting any deploy, not after.
- **`pdfjs`'s `getTextContent()` returns items in PDF content-stream order, not visual reading order.** For two-column layouts (the norm for academic papers — exactly what this app is for) some PDF producers emit column text interleaved line-by-line, garbling both columns together and producing chunks that mix unrelated content. A single-chunk or few-chunk test PDF can't surface this — it takes a real multi-column document to catch. Fixed with column-gap detection in `extractPdfText`'s `reconstructReadingOrder`; verify any future change here against both a single-column and a genuine two-column test PDF, not just one.
- **Fixed-size chunking is fragile to any upstream edit.** Changing extracted text length anywhere (stripping a section, skipping a page) shifts every later chunk boundary, which can silently regress retrieval quality for unrelated content elsewhere in the document. Tried skipping a whole page to remove table-of-contents noise once — it also removed real content sharing that page and broke several previously-working answers. Always re-run the full suggested-question test set after any corpus-building change, not just the one question you were fixing.
- **A review paper's bibliography is pure retrieval noise** — citation-list text is dense with the same domain keywords as real content, so it ranks highly by cosine similarity while adding zero explanatory value, actively crowding out better chunks. `scripts/build-corpus.mjs`'s `stripBibliography()` detects and removes it via `,` + year + `,` pattern density (a citation-list signature), which generalizes across papers, unlike a hardcoded section-heading search.
- **A paper's own table-of-contents page can dilute the one chunk containing an important definition** if column-gap detection fails on that page (TOC dot-leaders can narrow the gap below the detection threshold). No general fix landed for this — when a specific suggested question retrieves a good source sentence but the model still says "not covered," check whether the containing chunk is interleaved with TOC noise before assuming it's a model/prompt problem.
- **A superscript/special-character glyph (e.g. the `*` in `T2*`) can extract as a control character**, not the visible symbol, depending on the PDF's font encoding. A question using that exact notation then embeds nothing like the source text. Prefer suggested questions phrased in plain prose the paper's actual sentences would use, not symbolic shorthand, until there's a reason to trust a specific paper's glyph extraction.

## Feature 1 — Profile page

- Static content only, except the copy-email button. No login, no database.
- Must render with no layout breakage from 320px to 1920px viewport width.

## Feature 2 — NV-diamond research assistant chatbot

Fixed knowledge base (one pre-embedded paper, see "Cycle 2 pivot" above) — no visitor upload. Suggested-question chips on first load; free-text input always available.

- 512-dim embeddings (`text-embedding-3-small`), top-10 cosine-similarity chunks as context per question.
- Scoped to the paper's subject: off-topic questions get a polite redirect, not an attempt to answer — enforced via the system prompt in `/api/chat`.
- If an answer isn't supported by the retrieved chunks, the bot must say the paper doesn't cover it — never guess.
- If the OpenAI call times out or hits a rate limit, show `Something went wrong (<reason>)` with the real reason. No automatic retry.
- No logging of questions, chunks, or answers in `/api/chat` (or any future route) — the one lesson from Cycle 1 that still applies even without visitor uploads.
- Chat state (message history) lives only in client memory. A page refresh clears it — no sessionStorage/localStorage/backend persistence. The corpus itself is a static server-side asset, not per-session state.

## Out of scope — do not build

- User accounts/login.
- Visitor PDF uploads (superseded by the fixed-corpus pivot — see above).
- Persistent chat history across sessions.
- Admin/analytics dashboard.
- Upload/question rate limiting.
- Non-English questions.

## Accessibility bar

Semantic HTML, alt text, keyboard-operable controls, sufficient color contrast. Not a full WCAG audit.

## Security & secrets

- The chatbot's knowledge base is a public, already-published paper the lab chose to embed — non-confidential. Never assume otherwise; don't add handling for private/personal data.
- Secrets (`OPENAI_API_KEY`, `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`) live only in `.env`, which is gitignored. Never print, log, or echo their values.
- When configuring the deployed Vercel project's environment variables, set **only `OPENAI_API_KEY`** (ideally a key dedicated to this project). `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, and `VERCEL_TOKEN` are for local CLI tooling only and must never be added to the app's runtime environment — a `VERCEL_TOKEN` living inside its own public app is self-escalating (any future leak lets an attacker redeploy the site).

## Design

- Mood: clean, minimal, academic/professional.
- Primary color: Korea University blue.
- Mobile-first responsive; no horizontal scrolling at any supported width.
