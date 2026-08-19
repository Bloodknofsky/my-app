"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyEmailButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus("copied");
    } catch {
      setStatus("failed");
    } finally {
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const label =
    status === "copied" ? "Copied!" : status === "failed" ? "Copy failed" : "Copy email";

  return (
    <span className="inline-flex flex-col items-center gap-1.5 sm:items-start">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy email address ${email}`}
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-3 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 sm:text-base"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <rect x="8" y="7" width="12" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        {label}
      </button>
      <span role="status" aria-live="polite" className="text-sm font-medium text-blue-700">
        {status === "failed" && "Couldn't copy — select the email text above instead."}
      </span>
    </span>
  );
}
