import Link from "next/link";

// Stub page: unblocks the "/" -> "/chatbot" link before PLAN task 5 builds
// the real upload area + chat window per DESIGN.md.
export default function ChatbotPage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <p>
        <Link href="/">&larr; Back to profile</Link>
      </p>
      <h1 className="text-2xl font-semibold mt-4">RAG Chatbot</h1>
      <p className="mt-2">Coming soon.</p>
    </div>
  );
}
