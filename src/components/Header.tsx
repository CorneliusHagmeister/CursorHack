"use client";

import Link from "next/link";
import { AuthMenu } from "@/components/AuthMenu";
import { SearchBox } from "@/components/SearchBox";

const CUTS = ["Straight", "Slim", "Relaxed", "Wide"] as const;

export function Header() {
  return (
    <header className="sticky top-3 z-40 mx-3 mt-3 rounded-tile bg-white">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 font-slab text-xl font-bold text-ink">
          <img
            src="/haggleberry-mark.svg"
            alt=""
            width={39}
            height={32}
            className="h-7 w-auto shrink-0"
            aria-hidden
          />
          Haggleberry
        </Link>

        <SearchBox />

        <nav aria-label="Cuts and account" className="ml-auto flex items-center gap-1">
          {CUTS.map((cut, index) => (
            <Link
              key={cut}
              href={`/?cut=${encodeURIComponent(cut)}`}
              className={`text-caps hidden rounded-tile px-2 py-1.5 text-ink hover:bg-floor ${
                index === 0 ? "md:inline" : "lg:inline"
              }`}
            >
              {cut}
            </Link>
          ))}
          <Link href="/merchant" className="text-caps rounded-tile px-2 py-1.5 text-ink hover:bg-floor">
            Sell
          </Link>
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
