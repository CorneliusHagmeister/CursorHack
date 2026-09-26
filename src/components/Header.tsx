"use client";

import Link from "next/link";
import { AuthMenu } from "@/components/AuthMenu";
import { SearchBox } from "@/components/SearchBox";

const CUTS = ["Straight", "Slim", "Relaxed", "Wide"] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-stone-900"
        >
          Indigo Lane
        </Link>

        <SearchBox />

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
