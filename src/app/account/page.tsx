"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StatementCard } from "@/components/StatementCard";

const signInLink = (code: string, origin: string) => `${origin}/login?code=${encodeURIComponent(code)}`;

const agentNote = (code: string, origin: string) =>
  [
    "Shop on Haggleberry for me.",
    "",
    `Open this link to sign in as me: ${signInLink(code, origin)}`,
    "",
    "You then have my size, budget, and past buys. Do not ask for my password. The link works once.",
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
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<HTMLInputElement>(null);

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
    setLink(null);
    try {
      const res = await fetch("/api/auth/session-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not prepare a note");
      const origin = window.location.origin;
      setNote(agentNote(data.code as string, origin));
      setLink(signInLink(data.code as string, origin));
      setExpiresAt(data.expiresAt as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = () => {
    if (!link) return;
    const markCopied = () => setCopied(true);
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(link).then(markCopied).catch(() => {
        const field = promptRef.current;
        field?.focus();
        field?.select();
        if (document.execCommand("copy")) markCopied();
      });
      return;
    }
    const field = promptRef.current;
    field?.focus();
    field?.select();
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
        Your agent is about to shop blind. A link gives it your size and budget,
        so it can haggle the way you would. Your password stays on this page.
      </p>

      <section className="mt-6">
        <button
          type="button"
          onClick={() => void handleGiveAccess()}
          disabled={busy}
          className="rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          Give your agent a sign-in link
        </button>
        <div aria-live="polite">
          {link && note && (
            <>
              <p className="mt-4 text-sm text-stone-600">
                Give this to your agent. It signs in as you, already filled in.{" "}
                {expiresAt
                  ? `Works once, until ${new Date(expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.`
                  : "Works once."}
              </p>
              <div className="mt-3 flex items-stretch gap-2">
                <input
                  ref={promptRef}
                  readOnly
                  value={link}
                  aria-label="Sign-in link for your agent"
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-stone-500 underline">
                  Or read it a note instead
                </summary>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{note}</p>
              </details>
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
