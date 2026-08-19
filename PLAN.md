# PLAN — Arman Sykot profile site (Cycle 1)

Source: [PRD.md](PRD.md)

## Goal

Ship both PRD features end-to-end in `my-app`: a static researcher profile page, and a PDF RAG chatbot that answers questions grounded only in an uploaded document.

## Success criteria

- A visitor can go upload PDF → ask a question → get an answer in under 30 seconds.
- Every PRD error case (bad file type, oversized file, unreadable/password-protected PDF, replace-document, API timeout/rate-limit — including on `/api/embed`, not just `/api/chat`) shows a clear, specific message — none fail silently. The four cases where PRD fixes exact copy (non-PDF, no readable text, password-protected/corrupt, replace-warning) must use that exact wording; the oversized-file case only requires "a clear error message" per PRD, so its wording is our choice.
- An ungrounded question gets a "don't know" style answer instead of a fabricated one (PRD fixes the behavior, not the exact wording).
- The profile page renders with no layout breakage from 320px to 1920px (PRD §5-1 requirement). The chat UI is also checked at the same range as an added project goal, not a PRD-mandated one.
- Document and chat state live only in memory — refreshing the page clears both (PRD rule 10 — currently untested; add this as an explicit Check-phase scenario).
- No feature from PRD §6 "out of scope" gets built, and neither does OCR (PRD rule 6) or a password-entry flow (PRD rule 7).
- Baseline accessibility bar is met on both pages: semantic HTML, alt text, keyboard-operable controls, sufficient color contrast (PRD §6 in-scope item).
- `OPENAI_API_KEY` is only ever read server-side (inside API routes) and never reaches client-side code or the browser.
- Grounding-accuracy check (PRD's "95% of the time" target): since we can't measure a statistical rate in this exercise, use a fixed manual test set of 5 grounded + 5 ungrounded questions against one sample PDF; pass requires all 5 grounded answers to cite the document and all 5 ungrounded ones to get a "don't know" response.
- PRD's "reduce direct research-question emails by ~50%" is a post-launch usage metric, not something this build can verify before real visitors use it — noted here so it isn't lost, but it's not a Check-phase gate.
- PRD's accepted limitation "no usage/rate limiting on uploads or questions" is a deliberate non-goal for this exercise, same as the English-only restriction — not a gap to fix.

## Tasks (build order)

1. Initialize the Next.js (App Router, TypeScript, Tailwind) project in `my-app`, matching the stack locked in CLAUDE.md. Confirm `.env` holds all four PRD §7 keys (`OPENAI_API_KEY`, `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`) and that `.gitignore` excludes it.
2. Scaffold the profile page layout (header, hero, contact section — name, title, research focus, contact only, per PRD §5-1) with static placeholder content.
3. Style the profile page to the design feel/colors and verify no layout breakage from 320px to 1920px.
4. Implement the copy-email button: copy the address, show "Copied!" for ~2 seconds then revert, and fall back to showing the email as plain selectable text if the clipboard API fails.
5. Add the `/chatbot` route and its basic UI shell (upload area, chat window disabled/empty until a PDF is successfully processed, and a link back to the profile page so the PRD's "email Arman directly" flow stays reachable).
6. Build the PDF upload control with client-side file-type and 10MB size checks. Non-PDF rejection uses PRD's exact string `"Only PDF files are supported."`; the size check uses a clear message of our own choosing (PRD doesn't fix its wording) and rejects rather than caps the file, per CLAUDE.md.
7. Implement client-side PDF text extraction with `pdfjs-dist`, with three distinct outcomes: fails to open → PRD's exact `"This PDF is password-protected or corrupted — try a different file."`; opens but throws during extraction → `"This PDF couldn't be processed — try a different file."`; opens and extracts but yields no text → PRD's exact `"This PDF has no readable text — try a different file."`.
8. Implement fixed 800-character text chunking on the extracted text, with no overlap between chunks (simplest reading of PRD's "fixed at 800 characters").
9. Build the `/api/embed` route to generate embeddings for uploaded chunks using `text-embedding-3-small` at 512 dimensions (reduced from the 1536 default to keep payloads small), returning `{ vectors: number[][] }`, and surfacing `{ error: "Something went wrong (<reason>)" }` on its own timeout/rate-limit failures (PRD rule 9 applies to any OpenAI call, not just chat).
10. Build the `/api/chat` route: accept `{ question, chunks, vectors }`, embed the question at the same 512 dimensions, run cosine-similarity retrieval, keep only the top 5 chunks as context, and return `{ answer: string }` — a single complete answer, no streaming.
11. Add the "don't know" fallback in `/api/chat` for answers unsupported by retrieved chunks, and the `{ error: "Something went wrong (<reason>)" }` timeout/rate-limit response.
12. Build the chat UI (message list, input box, loading state) wired to `/api/chat`.
13. Add the replace-document confirmation warning using PRD's exact string `"Uploading a new PDF will replace the current document and clear the chat."`; on confirm, clear the old chunks, vectors, and chat messages together before restarting the upload path (PRD rule 8 — never mix chunks from two documents).
14. Accessibility pass across both pages: semantic HTML, alt text, keyboard-operable controls, sufficient color contrast.
15. End-to-end test: upload a real PDF, ask a grounded question, then an ungrounded one, confirm the memory-only/no-persistence rule on refresh, and run the 5+5 grounding test set above.
