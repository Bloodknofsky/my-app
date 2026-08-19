# [Arman Sykot Profile Site] Service Plan (PRD)

- Author: Arman Sykot
- Date: 2026-08-18

---

## 1. Background (problem definition)
*Who, in what work, experiences what inconvenience.*

Colleagues, collaborators, and prospective students/advisors who visit Arman Sykot's personal academic profile page have no way to get answers straight from his research — they can only read the static page and are left emailing back and forth for anything not already written there. This app is a personal profile page for a quantum sensing researcher, with a built-in PDF RAG chatbot so visitors can ask questions grounded in an uploaded document instead.

---

## 2. Current approach and its limits
*How this is handled now, and what falls short.*

Today the profile is a static, hand-maintained page with bio, research focus, and contact info, and no search or Q&A capability. A visitor has to read through the page manually, and any question not already answered there requires emailing Arman directly. This doesn't scale for collaborators or reviewers who want a quick, specific answer grounded in one of his documents.

---

## 3. Goals and expected impact (success criteria)
*In measurable numbers (processing time, number of inquiries, accuracy, etc.).*

- A visitor can get a document-grounded answer in under 30 seconds (upload PDF → ask → answer).
- Chatbot answers are grounded in the retrieved chunks at least 95% of the time (no fabricated answers outside the uploaded document).
- Reduce direct research-question emails by an estimated 50% by letting visitors self-serve through the chatbot.

---

## 4. Users and the usage flow
*Who uses it and the order of use (with arrows).*

Primary users: colleagues, collaborators, and prospective students/advisors visiting the profile.

Flow: Visitor lands on profile page → reads bio/research focus/contact → clicks "RAG Chatbot" → uploads a PDF → asks a question → chatbot retrieves top-matching chunks and answers → visitor emails Arman directly if they need more.

---

## 5. Key features (split into must / nice)
*List the must-have features and the nice-to-have features separately.*

### 1) Researcher profile page
- Description: Single home page with name, title, research focus, and contact section.
- Rules the AI must follow:
  1. No login, no database — content is static except the copy-email button.
  2. Must render without layout breakage from 320px to 1920px viewport width.

### 2) RAG chatbot for document Q&A
- Description: Visitor uploads a PDF; app extracts/chunks/embeds text and answers questions grounded in it.
- Rules the AI must follow:
  1. Chunk size fixed at 800 characters; retrieve only the top 5 most similar chunks (cosine similarity) as context.
  2. Reject or cap PDF uploads over 10MB with a clear error message.
  3. If the answer isn't supported by the retrieved chunks, the bot must say it doesn't know rather than guessing.
  4. Any PDF parsing failure must show a specific error message to the user — never fail silently.
  5. Reject non-PDF file uploads client-side with the error message "Only PDF files are supported."
  6. If text extraction returns no readable text (e.g. a scanned/image-only PDF), show "This PDF has no readable text — try a different file." OCR is out of scope for this exercise.
  7. If the PDF fails to open (e.g. password-protected or corrupted), show "This PDF is password-protected or corrupted — try a different file." Password entry is out of scope for this exercise.
  8. If a document is already loaded and the visitor tries to upload another, show a warning first ("Uploading a new PDF will replace the current document and clear the chat.") before replacing it — never mix chunks from two documents.
  9. If the OpenAI API call times out or hits a rate limit, show "Something went wrong (<reason>)" with the actual reason (e.g. timeout, rate limit) in the brackets — no automatic retry.
  10. Document and chat state live only in memory — a page refresh resets both (no sessionStorage/localStorage/backend persistence).

---

## 6. Scope and out-of-scope
*What will / won't be built in this exercise.*

**In scope (this exercise):** the researcher profile page and the RAG chatbot for document Q&A, as described in section 5 above, with a baseline accessibility bar (semantic HTML, alt text, keyboard-operable controls, sufficient color contrast) — not full WCAG audit/testing.

**Out of scope (this exercise):**
- No user accounts/login.
- No multi-document library (one PDF at a time, not saved/managed).
- No persistent chat history across sessions.
- No admin/analytics dashboard.
- No usage/rate limiting on uploads or questions — accepted as a known limitation for this exercise, not a production concern.
- English only — non-English PDFs/questions are not supported in this exercise.

---

## 7. Security and privacy review
*The confidentiality level of the documents used, whether personal data is involved, how API keys are managed.*

Documents uploaded to the chatbot are the researcher's own already-published academic papers (public, non-confidential) — no private or personal data is processed. API keys (`OPENAI_API_KEY`, `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`) are kept in a local `.env` file excluded from version control via `.gitignore`, and their values are never printed or logged.

---

## 8. Technology stack
*The set of tools used for development (fixed to Next.js in this course).*

- Next.js — handles the screen and the server-side code (API) in one project.
- Reason it's fixed: it's the same setup used in the Part 1–2 practice, and we'll deploy to Vercel in Part 5, so this keeps everything continuous.
- Embedding model: `text-embedding-3-small`.
- Chat completion model: `gpt-4o-mini`.

---

## Development units

1. Scaffold the profile page layout (header, hero section, contact section) with static content.
2. Style the profile page to match the design feel/colors and confirm no layout breakage from 320px to 1920px.
3. Add the "RAG Chatbot" page route and its basic UI shell (upload area, empty chat window).
4. Build the PDF upload control with a file-type check (PDF only) and a 10MB size check, each with a clear error message.
5. Implement client-side PDF text extraction with pdfjs-dist, with error messages for both extraction failures and no-readable-text results.
6. Implement text chunking at a fixed 800-character chunk size.
7. Build the `/api/embed` route to generate embeddings for uploaded chunks.
8. Build the `/api/chat` route to embed the user's question and run cosine-similarity retrieval.
9. Wire retrieval to keep only the top 5 most similar chunks as context for the answer.
10. Add the "answer not supported by retrieved chunks → say don't know" fallback in the chat response logic.
11. Build the chat UI (message list, input box, loading state) and connect it to `/api/chat`.
12. Add a replace-document warning when a new PDF is uploaded while one is already loaded.
13. End-to-end test: upload a real PDF, ask a grounded question, and confirm an ungrounded question triggers the don't-know fallback.
