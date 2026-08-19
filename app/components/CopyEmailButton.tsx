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
    status === "copied" ? "Copied!" : status === "failed" ? "Copy failed" : "Copy";

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={handleCopy} aria-label={`Copy email address ${email}`}>
        {label}
      </button>
      <span role="status" aria-live="polite" className="text-sm">
        {status === "copied" && "Copied!"}
        {status === "failed" && "Couldn't copy — select the email text above instead."}
      </span>
    </span>
  );
}
