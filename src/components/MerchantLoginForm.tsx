"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function MerchantLoginForm({ next, demo }: { next: string; demo: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState(demo ? "indigo-merchant" : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Sign-in failed");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm">
        <span className="text-stone-600">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      {demo && <p className="text-xs text-stone-500">Demo password: indigo-merchant</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy || !password}
        className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
