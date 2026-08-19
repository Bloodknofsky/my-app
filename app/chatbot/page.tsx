"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type DocState = {
  name: string;
  status: "parsing" | "ready" | "error";
  message?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHUNK_SIZE = 800;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MSG_ONLY_PDF = "Only PDF files are supported.";
const MSG_TOO_LARGE = "This PDF is over 10MB — please choose a smaller file.";
const MSG_PASSWORD_OR_CORRUPT =
  "This PDF is password-protected or corrupted — try a different file.";
const MSG_PARSE_FAILED = "This PDF couldn't be processed — try a different file.";
const MSG_NO_TEXT = "This PDF has no readable text — try a different file.";
const MSG_REPLACE_WARNING =
  "Uploading a new PDF will replace the current document and clear the chat.";

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
  }
  return chunks.filter((chunk) => chunk.length > 0);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: buffer, isEvalSupported: false }).promise;
  } catch {
    throw new Error(MSG_PASSWORD_OR_CORRUPT);
  }

  try {
    let text = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => ("str" in item ? item.str : ""));
      text += strings.join(" ") + "\n";
    }
    return text;
  } catch {
    throw new Error(MSG_PARSE_FAILED);
  }
}

async function embedChunks(chunks: string[]): Promise<number[][]> {
  const res = await fetch("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chunks }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Embedding request failed (${res.status})`);
  }
  return data.vectors;
}

export default function ChatbotPage() {
  const [doc, setDoc] = useState<DocState | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [vectors, setVectors] = useState<number[][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setDoc({ name: file.name, status: "error", message: MSG_ONLY_PDF });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setDoc({ name: file.name, status: "error", message: MSG_TOO_LARGE });
      return;
    }

    setChunks([]);
    setVectors([]);
    setMessages([]);
    setDoc({ name: file.name, status: "parsing" });

    try {
      const text = await extractPdfText(file);
      const pieces = chunkText(text);

      if (pieces.length === 0) {
        setDoc({ name: file.name, status: "error", message: MSG_NO_TEXT });
        return;
      }

      const docVectors = await embedChunks(pieces);
      setChunks(pieces);
      setVectors(docVectors);
      setDoc({ name: file.name, status: "ready" });
    } catch (err) {
      const message = err instanceof Error ? err.message : MSG_PARSE_FAILED;
      setDoc({ name: file.name, status: "error", message });
    }
  };

  const handleFileChosen = (file: File) => {
    if (doc && doc.status !== "error") {
      const confirmed = window.confirm(MSG_REPLACE_WARNING);
      if (!confirmed) return;
    }
    processFile(file);
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || sending || doc?.status !== "ready") return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chunks, vectors }),
      });
      const data = await res.json().catch(() => null);
      const answer = res.ok
        ? (data.answer as string)
        : data?.error || "Something went wrong (unexpected error)";

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong (network error)" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const chatReady = doc?.status === "ready";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="flex w-full max-w-4xl flex-col items-center gap-3 px-6 pt-10 pb-4 sm:pt-14">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          ← Back to profile
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
          RAG Chatbot
        </h1>
        <p className="max-w-md text-center text-sm text-slate-600 sm:text-base">
          Upload a PDF, then ask questions. Answers are based only on what&apos;s in that
          document.
        </p>
      </header>

      <main className="flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 pb-16 sm:px-10">
        {/* Upload */}
        <section className="rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-sm shadow-blue-900/5 sm:px-8">
          <h2 className="mb-4 text-base font-semibold text-blue-950 sm:text-lg">Document</h2>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path d="M12 4v11" />
              <path d="m7 9 5-5 5 5" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            {doc ? "Replace PDF" : "Upload PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChosen(file);
              e.target.value = "";
            }}
          />

          {doc && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5 text-sm">
              <span className="truncate font-medium text-blue-950">{doc.name}</span>
              {doc.status === "parsing" && <span className="text-slate-500">Reading…</span>}
              {doc.status === "ready" && (
                <span className="font-medium text-blue-700">Document ready.</span>
              )}
              {doc.status === "error" && (
                <span className="text-right font-medium text-red-600">{doc.message}</span>
              )}
            </div>
          )}
        </section>

        {/* Chat */}
        <section className="flex flex-1 flex-col rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-sm shadow-blue-900/5 sm:px-8">
          <h2 className="mb-4 text-base font-semibold text-blue-950 sm:text-lg">Ask a question</h2>

          <div className="flex min-h-[16rem] flex-1 flex-col gap-4 overflow-y-auto rounded-xl bg-blue-50/50 p-4">
            {messages.length === 0 && (
              <p className="m-auto max-w-xs text-center text-sm text-slate-500">
                {chatReady
                  ? "Ask a question to get started."
                  : "Upload a PDF to start asking questions."}
              </p>
            )}
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:text-base ${
                    message.role === "user"
                      ? "bg-blue-700 text-white"
                      : "border border-blue-100 bg-white text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm text-slate-500">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={!chatReady}
              placeholder={chatReady ? "Ask a question about the document…" : "Waiting for a document…"}
              className="flex-1 rounded-full border border-blue-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50 sm:text-base"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!chatReady || sending || !input.trim()}
              className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              Send
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
