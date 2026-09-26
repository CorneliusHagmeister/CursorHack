"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const prefilled = code.length > 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code did not work");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code did not work");
    } finally {
      setBusy(false);
    }
  };

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

      <form onSubmit={handleCode} className="mt-8">
        <label className="block text-sm" htmlFor="one-time-code">
          One-time code
        </label>
        <input
          id="one-time-code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          placeholder="From the shopper"
          aria-describedby="code-hint"
          className={`mt-1 w-full rounded-xl border px-3 py-2 ${
            prefilled ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-900" : "border-stone-200 bg-white"
          }`}
          required
        />
        <p id="code-hint" className="mt-2 text-sm text-stone-500">
          {prefilled
            ? "Filled in from the shopper's link. It signs you in as them. It is not a password."
            : "Paste the code they gave you. It signs you in as them. It is not a password."}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          Sign in with this code
        </button>
      </form>

      <button
        type="button"
        onClick={() => void handleDemo()}
        disabled={busy}
        className="mt-8 w-full rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
      >
        Continue as demo shopper
      </button>

      <form onSubmit={handleLogin} className="mt-10 space-y-4">
        <h2 className="text-sm font-medium text-stone-800">Or use your email</h2>
        <label className="block text-sm" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm" htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
          Sign in with email
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-sm text-stone-500 sm:px-6">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
