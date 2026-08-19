# [Arman Sykot Profile Site] Service Plan (PRD_lite)

- Author: Arman Sykot
- Date: 2026-08-18

---

## 1. In one line, what is this app?
- Answer: A personal academic profile page for a quantum sensing researcher, with a built-in PDF RAG chatbot for document Q&A.

---

## 2. Who uses it, and why? (just one line each!)
- Who uses it?
  - Answer: Colleagues, collaborators, and prospective students/advisors visiting the researcher's profile.
- What inconvenience does it solve?
  - Answer: Lets visitors read about the research and get answers straight from an uploaded document, instead of emailing back and forth.

---

## 3. Core features to build (exactly 2!)
> 💡 If you try to build too many features, the AI tangles up the code.
> Pick just the 2 most important features and give the AI their "rules."

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

---

## 4. Features you will definitely NOT build this time (let go of extras)
> 💡 Declaring "I won't build this" to the AI up front keeps it from coding the wrong things.
- No user accounts/login.
- No multi-document library (one PDF at a time, not saved/managed).
- No persistent chat history across sessions.
- No admin/analytics dashboard.

---

## 5. Design feel and colors
- Overall mood: Clean, minimal, academic/professional.
- Main color: Blue (Korea University blue).
- Screen-size constraints: Mobile-first responsive; must work from small phones up to desktop with no horizontal scrolling.
