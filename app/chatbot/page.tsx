"use client";

import Link from "next/link";
import { useState } from "react";
import PixelCompanion from "../components/PixelCompanion";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const PAPER_TITLE = "Sensitivity optimization for NV-diamond magnetometry";
const PAPER_CITATION = "Barry et al., Reviews of Modern Physics 92, 015004, 2020";

const SUGGESTED_QUESTIONS = [
  "What are diamond NV centers?",
  "How does nitrogen concentration affect NV magnetometer performance?",
  "What limits NV-diamond magnetometer sensitivity?",
  "What is spin dephasing and why does it matter for sensing?",
  "How does readout fidelity affect sensitivity?",
  "What methods can extend NV coherence time?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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

  const handleSend = () => sendQuestion(input);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="flex w-full max-w-4xl flex-col items-center gap-3 px-6 pt-10 pb-4 sm:pt-14">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          ← Back to profile
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
          NV-Diamond Research Assistant
        </h1>
        <PixelCompanion thinking={sending} />
        <p className="max-w-lg text-center text-sm text-slate-600 sm:text-base">
          Ask about diamond NV-center quantum sensing. Answers are grounded in{" "}
          <span className="font-medium text-blue-900">&ldquo;{PAPER_TITLE}&rdquo;</span> (
          {PAPER_CITATION}).
        </p>
      </header>

      <main className="flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 pb-16 sm:px-10">
        {messages.length === 0 && (
          <section className="rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-sm shadow-blue-900/5 sm:px-8">
            <h2 className="mb-4 text-base font-semibold text-blue-950 sm:text-lg">
              Try asking
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  disabled={sending}
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-1 flex-col rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-sm shadow-blue-900/5 sm:px-8">
          <h2 className="mb-4 text-base font-semibold text-blue-950 sm:text-lg">Ask a question</h2>

          <div className="flex min-h-[16rem] flex-1 flex-col gap-4 overflow-y-auto rounded-xl bg-blue-50/50 p-4">
            {messages.length === 0 && (
              <p className="m-auto max-w-xs text-center text-sm text-slate-500">
                Pick a question above, or type your own about NV-diamond magnetometry.
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
              placeholder="Ask about NV-diamond magnetometry…"
              className="flex-1 rounded-full border border-blue-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 sm:text-base"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
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
