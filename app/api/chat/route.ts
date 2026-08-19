import { NextRequest, NextResponse } from "next/server";
import corpus from "@/data/nv-corpus.json";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512;
const CHAT_MODEL = "gpt-4o-mini";
const TOP_K = 10;
const OPENAI_TIMEOUT_MS = 30000;
const MAX_QUESTION_LENGTH = 2000;

function errorResponse(reason: string, status: number) {
  return NextResponse.json({ error: `Something went wrong (${reason})` }, { status });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function callOpenAI(
  url: string,
  apiKey: string,
  body: unknown,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (
    typeof question !== "string" ||
    !question.trim() ||
    question.length > MAX_QUESTION_LENGTH
  ) {
    return NextResponse.json({ error: "No question provided." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse("server misconfigured", 500);
  }

  try {
    const embedRes = await callOpenAI(
      "https://api.openai.com/v1/embeddings",
      apiKey,
      { model: EMBEDDING_MODEL, input: question, dimensions: EMBEDDING_DIMENSIONS },
      OPENAI_TIMEOUT_MS
    );
    if (embedRes.status === 429) return errorResponse("rate limit", 429);
    if (!embedRes.ok) return errorResponse("service error", 502);

    const embedData = await embedRes.json();
    const questionVector: number[] = embedData.data[0].embedding;

    const ranked = corpus.chunks
      .map((text: string, i: number) => ({
        text,
        score: cosineSimilarity(corpus.vectors[i] as number[], questionVector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const contextBlock = ranked
      .map((c, i) => `[Excerpt ${i + 1}]\n${c.text}`)
      .join("\n\n");

    // The corpus is a single trusted, pre-loaded research paper (not visitor
    // content), but the grounding + scope rules still apply: answer only from
    // the excerpts, and stay on the paper's subject even if asked something else.
    const systemPrompt = `You are a research assistant for Arman Sykot's quantum sensing lab, answering questions about "${corpus.title}" by ${corpus.authors} (${corpus.source}).
Only use the excerpts given in the user message to answer — never outside knowledge, never a guess.
If the excerpts don't support an answer, say plainly that the paper doesn't cover it.
If the question isn't about diamond NV centers, quantum sensing, or this paper's subject matter, politely say this assistant is scoped to that topic and suggest asking something related instead.
Reply in English, concisely, at a level useful for a research trainee.`;

    const userPrompt = `Excerpts from the paper:

<<<EXCERPTS_START>>>
${contextBlock}
<<<EXCERPTS_END>>>

Using only the excerpts above, answer this question. If they don't support an answer, say the paper doesn't cover it.

Question: ${question}`;

    const chatRes = await callOpenAI(
      "https://api.openai.com/v1/chat/completions",
      apiKey,
      {
        model: CHAT_MODEL,
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      OPENAI_TIMEOUT_MS
    );
    if (chatRes.status === 429) return errorResponse("rate limit", 429);
    if (!chatRes.ok) return errorResponse("service error", 502);

    const chatData = await chatRes.json();
    const answer: string =
      chatData.choices?.[0]?.message?.content?.trim() ||
      "I don't have enough information in the paper to answer that.";

    return NextResponse.json({ answer });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError" ? "timeout" : "service error";
    return errorResponse(reason, 502);
  }
}
