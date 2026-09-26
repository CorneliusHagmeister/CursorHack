"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

type Me = { signedIn: boolean; name?: string };

export function AuthMenu() {
  const [me, setMe] = useState<Me>({ signedIn: false });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: Me) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe({ signedIn: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (me.signedIn) {
    return (
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white"
        aria-label={`Signed in as ${me.name ?? "shopper"}`}
      >
        <User className="h-3.5 w-3.5" aria-hidden />
        {me.name?.split(" ")[0] ?? "Account"}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
    >
      Sign in
    </Link>
  );
}
