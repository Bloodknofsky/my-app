import { NextRequest, NextResponse } from "next/server";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512;
const OPENAI_TIMEOUT_MS = 20000;
const MAX_CHUNKS = 500;

function errorResponse(reason: string, status: number) {
  return NextResponse.json({ error: `Something went wrong (${reason})` }, { status });
}

export async function POST(req: NextRequest) {
  const { chunks } = await req.json();

  if (
    !Array.isArray(chunks) ||
    chunks.length === 0 ||
    !chunks.every((c) => typeof c === "string")
  ) {
    return NextResponse.json({ error: "No text provided." }, { status: 400 });
  }
  if (chunks.length > MAX_CHUNKS) {
    return NextResponse.json(
      { error: "Document is too large to process." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse("server misconfigured", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: chunks,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      return errorResponse("rate limit", 429);
    }
    if (!response.ok) {
      return errorResponse("service error", 502);
    }

    const data = await response.json();
    const vectors: number[][] = data.data.map(
      (item: { embedding: number[] }) => item.embedding
    );
    return NextResponse.json({ vectors });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError" ? "timeout" : "service error";
    return errorResponse(reason, 502);
  } finally {
    clearTimeout(timeout);
  }
}
