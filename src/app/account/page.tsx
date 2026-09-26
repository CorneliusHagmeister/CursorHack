"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StatementCard } from "@/components/StatementCard";

const agentNote = (code: string, origin: string) =>
  [
    "Shop on Indigo Lane for me.",
    "",
    `Open ${origin}/login`,
    `Sign in with this one-time code: ${code}`,
    "",
    "You then have my size, budget, and past buys. Do not ask for my password. The code works once.",
  ].join("\n");

type Me = {
  signedIn: boolean;
  name?: string;
  email?: string;
  budgetMax?: number;
  mode?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: Me) => {
        if (!data.signedIn) router.replace("/login");
        else setMe(data);
      });
  }, [router]);

  const handleGiveAccess = async () => {
    setBusy(true);
    setError(null);
    setCopied(false);
    setNote(null);
    try {
      const res = await fetch("/api/auth/session-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not prepare a note");
      const nextNote = agentNote(data.code as string, window.location.origin);
      setNote(nextNote);
      setExpiresAt(data.expiresAt as string);
      try {
        await navigator.clipboard.writeText(nextNote);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyNote = () => {
    if (!note) return;
    const field = promptRef.current;
    if (field) {
      field.focus();
      field.select();
    }
    const markCopied = () => setCopied(true);
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(note).then(markCopied).catch(() => {
        if (document.execCommand("copy")) markCopied();
      });
      return;
    }
    if (document.execCommand("copy")) markCopied();
  };

  const handleCreateToken = async () => {
    setBusy(true);
    setError(null);
    setToken(null);
    try {
      const res = await fetch("/api/auth/agent-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create token");
      setToken(data.token as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-stone-900">{me.name ?? "Account"}</h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
        Your agent is about to shop blind. A note gives it your size and budget,
        so it can haggle the way you would. Your password stays on this page.
      </p>

      <section className="mt-6">
        <button
          type="button"
          onClick={() => void handleGiveAccess()}
          disabled={busy}
          className="rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          Copy a note for your agent
        </button>
        <div aria-live="polite">
          {note && (
            <>
              <p className="mt-4 text-sm text-stone-600">
                {copied
                  ? "On your clipboard. Paste it into the chat."
                  : "Select the note and paste it into the chat."}{" "}
                {expiresAt
                  ? `It works once, until ${new Date(expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.`
                  : "It works once."}
              </p>
              <textarea
                ref={promptRef}
                readOnly
                value={note}
                rows={8}
                aria-label="Note for your agent"
                className="mt-4 w-full resize-none bg-transparent text-sm leading-relaxed text-stone-800 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyNote}
                className="mt-2 text-sm text-stone-600 underline"
              >
                {copied ? "Copied" : "Copy the note"}
              </button>
            </>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => void handleCreateToken()}
          disabled={busy}
          className="mt-8 block text-sm text-stone-500 underline"
        >
          A key for a tool you run yourself
        </button>
        {token && (
          <pre className="mt-3 overflow-x-auto text-xs text-stone-800">{token}</pre>
        )}
      </section>

      <StatementCard budgetMax={me.budgetMax} />

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-10 text-sm text-stone-500 underline"
      >
        Sign out
      </button>
    </div>
  );
}
