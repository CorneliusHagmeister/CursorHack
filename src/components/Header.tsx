"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { AuthMenu } from "@/components/AuthMenu";

const CUTS = ["Straight", "Slim", "Relaxed", "Wide"] as const;

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-slab text-xl font-bold text-rinse"
        >
          Haggleberry
        </Link>

        <form
          onSubmit={handleSearch}
          className="order-3 flex w-full flex-1 items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 sm:order-none sm:max-w-md"
          role="search"
        >
          <Search className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, wash, city"
            aria-label="Search the catalogue"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/?cut=Straight"
            className="hidden rounded-full px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 md:inline"
          >
            Straight
          </Link>
          {CUTS.slice(1).map((cut) => (
            <Link
              key={cut}
              href={`/?cut=${encodeURIComponent(cut)}`}
              className="hidden rounded-full px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 lg:inline"
            >
              {cut}
            </Link>
          ))}
          <Link
            href="/merchant"
            className="rounded-full px-2.5 py-1.5 text-stone-600 hover:bg-stone-100"
          >
            Sell
          </Link>
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
