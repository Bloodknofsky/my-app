# CHECK — Arman Sykot profile site (Cycle 1)

Source: gap analysis vs [DESIGN.md](DESIGN.md), success-criteria run against [PLAN.md](PLAN.md), and a security review, all run against the code as of PLAN tasks 1–4 (Next.js scaffold, profile page, copy-email button, `/chatbot` stub).

## Pass / Fail

**FAIL** — expected at this point in the build: the RAG chatbot itself (PLAN tasks 5–13) isn't built yet, so every criterion that depends on it fails by absence, not by a bug. Everything currently buildable (profile page, its accessibility, its secrets hygiene) passes. The one thing that needs attention *now*, before any further building, is the deployment/legacy-code risk below — it isn't part of `my-app`'s own code, but it can undo everything else if it ships.

## Items to fix, in priority order

1. ~~**[Security] Confirm Vercel's Root Directory will be `my-app`, not the repo root.**~~ **FIXED** — CLAUDE.md now carries an explicit, hard-to-miss rule to set the Root Directory to `my-app` at deploy time.
2. ~~**[Security] Verified bug in legacy code.**~~ **FIXED** — DESIGN.md's `/api/chat` contract now explicitly excludes any client-supplied `role`/`history` field, and states that if one is ever added, roles must be whitelisted server-side at runtime, not just type-annotated.
3. ~~**[Security] Duplicate secrets across two `.env` files; only one key belongs in production.**~~ **FIXED** — CLAUDE.md now explicitly restricts the Vercel project's runtime environment to `OPENAI_API_KEY` only; the other three tokens are marked local-tooling-only.
4. ~~**[Security] Set a hard monthly spend cap on the OpenAI key.**~~ **FIXED (by you)** — monthly budget, usage alerts, and a project-dedicated key were set directly in the OpenAI dashboard; not independently verifiable by me since it's inside your account.
5. ~~**[Security] No security headers configured.**~~ **FIXED** — `next.config.ts` now sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and `Permissions-Policy` on every route, verified live via `fetch()` response headers. CSP deliberately still deferred until `pdfjs-dist` is added (task 7), since its worker needs `worker-src blob:`.
6. ~~**[Security] `.claude/` and `trash/` aren't gitignored.**~~ **FIXED** — both added to `my-app/.gitignore`, verified with `git check-ignore` (including nested files like `trash/test.html`).
7. **[Build] The RAG chatbot itself doesn't exist yet** — PLAN tasks 5–13 (upload control, PDF extraction, chunking, `/api/embed`, `/api/chat`, chat UI, replace-document warning). This is the root cause of every functional FAIL below; not a defect, just the next work.
8. **[Design, for tasks 9–10] Server-side input validation is unspecified.** DESIGN.md has the client supply `{ question, chunks, vectors }` directly — the server needs its own bounds (max chunk count/length, question length, vector dimension = 512, reject malformed/zero-norm vectors) independent of the client-side checks in task 6, which don't protect the API.
9. **[Design, for tasks 10–11] No prompt-injection defense is planned.** Put PDF excerpts in a delimited **user** message (never the system message), state explicitly that it's untrusted data, and put the grounding instruction last. Whitelist roles per item 2.
10. **[Design, for task 11] PRD's `Something went wrong (<reason>)` risks leaking upstream error internals** (OpenAI errors can echo partial key text). Map to a fixed vocabulary (rate limit / timeout / service error) rather than passing raw error text through.
11. **[Design, for task 6/9] A 10MB PDF can produce far more chunks than DESIGN's "a few hundred" assumption** — cap total chunk count server-side, not just file size client-side.
12. **[Design, for task 7] Keep `pdfjs-dist` at or above 4.2.67** (its one real CVE was fixed there) and pass `isEvalSupported: false`; CLAUDE.md's Safari-driven downgrade must not cross below that floor.
13. **[Task 3, not yet done] No Korea University blue or color tokens, and no distinct visual treatment for the hero section** — the actual substance of task 3, needs your steer on the real design, not a quick patch.
14. **[Hygiene, low] No logging of chunks/questions/answers in the future API routes** — Vercel retains stdout logs, which would quietly break the "memory-only, no persistence" rule via a stray `console.log`.

## Success-criteria verdicts (run against PLAN.md's "Success criteria")

| # | Criterion | Verdict | Reason if failed |
|---|-----------|---------|-------------------|
| 1 | Upload PDF → ask → answer in <30s | FAIL | No upload/chat functionality exists yet (tasks 5–12 unbuilt) |
| 2 | Every PRD error case shows a clear, specific message | FAIL | None of the upload/extraction/replace/timeout error paths exist yet |
| 3 | Ungrounded question → "don't know" style answer | FAIL | No chat/API exists to test |
| 4 | No layout breakage 320–1920px | PASS (profile page, verified live) / N/A (chat UI is a stub) | — |
| 5 | Memory-only state; refresh clears both | FAIL | No document/chat state exists yet to test |
| 6 | No out-of-scope feature, OCR, or password-entry flow built | PASS | Trivially true — nothing in that category exists |
| 7 | Baseline accessibility bar on both pages | PASS | Semantic HTML confirmed, contrast ~16:1, native keyboard-operable controls |
| 8 | `OPENAI_API_KEY` never reaches client code | PASS | Confirmed via grep — no reference anywhere in `app/`, no `app/api/**` yet |
| 9 | 5+5 grounding test set | FAIL | Can't run — no chatbot exists |
| 10 | ~50% email-reduction (post-launch metric) | N/A | Explicitly not a Check-phase gate per PLAN.md |
| 11 | No-rate-limiting accepted limitation | PASS/N/A | Deliberate non-goal, nothing to violate it |

## Security review summary

**Code that exists today:** clean overall — no secret in any source file, nothing user-entered is rendered, no `dangerouslySetInnerHTML`/`eval`, no cookies/storage/logging, both `.env` files correctly gitignored, no secret in git history. The only PII is the researcher's own already-public email, per PRD. Risks found are all procedural/deployment-related — see items 1, 3, 5, 6 above.

**Planned design (tasks 5–13), not yet built:** the dominant risk is cost abuse of an unauthenticated OpenAI proxy (items 4, 8), followed by an unplanned prompt-injection surface (item 9) and a few medium-severity design gaps (items 10–12). None of these are current bugs — they're things to build correctly when their PLAN task comes up.

Full findings: see the security-architect review and gap analysis from this session for complete detail and file/line references.
