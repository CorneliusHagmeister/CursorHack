"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Me = {
  signedIn: boolean;
  name?: string;
  email?: string;
  mode?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: Me) => {
        if (!data.signedIn) router.replace("/login");
        else setMe(data);
      });
  }, [router]);

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
      <h1 className="text-2xl font-semibold text-stone-900">Account</h1>
      <p className="mt-2 text-sm text-stone-600">
        Signed in as {me.name}
        {me.email ? ` · ${me.email}` : ""}
      </p>
      <p className="mt-1 text-xs text-stone-400">Mode: {me.mode ?? "demo"}</p>

      <section className="mt-10 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-medium text-stone-900">Agent token</h2>
        <p className="mt-1 text-sm text-stone-500">
          Let your own agent call the same catalogue, offer desk, and checkout
          over REST or MCP. The token is shown once.
        </p>
        <button
          type="button"
          onClick={() => void handleCreateToken()}
          disabled={busy}
          className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Create agent token
        </button>
        {token && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs text-amber-50">
            {token}
          </pre>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-stone-400">
          Stage shortcut: <code>il_demo_agent_token</code> also works.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/product/apc-petit-new" className="underline">
          Open A.P.C. with your context
        </Link>
        <button type="button" onClick={() => void handleSignOut()} className="underline">
          Sign out
        </button>
      </div>
    </div>
  );
}
