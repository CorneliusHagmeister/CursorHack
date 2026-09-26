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
        className="text-caps inline-flex items-center gap-1.5 rounded-tile bg-ink px-2.5 py-1.5 text-white"
        aria-label={`Signed in as ${me.name ?? "shopper"}`}
      >
        <User className="h-3 w-3" aria-hidden />
        {me.name?.split(" ")[0] ?? "Account"}
      </Link>
    );
  }

  return (
    <Link href="/login" className="text-caps rounded-tile px-2.5 py-1.5 text-ink hover:bg-floor">
      Sign in
    </Link>
  );
}
