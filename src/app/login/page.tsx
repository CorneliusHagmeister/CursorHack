"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("sam.okonkwo@example.com");
  const [password, setPassword] = useState("indigo-demo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-in failed");
      router.push("/product/apc-petit-new");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo sign-in failed");
      router.push("/product/apc-petit-new");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-stone-900">Sign in</h1>
      <p className="mt-2 text-sm text-stone-500">
        Fit, budget, and past buys unlock on the product page after you sign in.
        The landing page stays anonymous.
      </p>

      <button
        type="button"
        onClick={() => void handleDemo()}
        disabled={busy}
        className="mt-8 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        Continue as demo shopper
      </button>
      <p className="mt-2 text-center text-xs text-stone-400">
        Sam Okonkwo · W31 · budget £90 · abandoned A.P.C. at £95
      </p>

      <form onSubmit={handleLogin} className="mt-10 space-y-4">
        <label className="block text-sm">
          <span className="text-stone-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
        >
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-500">
        <Link href="/" className="underline">
          Keep browsing as guest
        </Link>
      </p>
    </div>
  );
}
