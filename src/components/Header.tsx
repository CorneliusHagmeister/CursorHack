import Link from "next/link";
import { ShopperStrip } from "@/components/ShopperStrip";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f7f3ec]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-indigo-950 sm:text-xl">
            Indigo Lane
          </span>
          <span className="hidden text-sm text-stone-500 sm:inline">
            Second-hand denim
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-white/70"
          >
            Shop
          </Link>
          <Link
            href="/merchant"
            className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-white/70"
          >
            Merchant
          </Link>
          <span className="hidden rounded-full bg-indigo-950 px-3 py-1.5 text-xs font-medium text-amber-50 sm:inline">
            Pair &amp; Perk
          </span>
        </nav>
      </div>
      <ShopperStrip />
    </header>
  );
}
