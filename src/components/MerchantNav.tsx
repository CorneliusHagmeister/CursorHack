"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/merchant", label: "Orders" },
  { href: "/merchant/live", label: "Live negotiations" },
];

export function MerchantNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Merchant" className="mx-auto flex max-w-6xl gap-1 px-4 pt-6 text-sm sm:px-6">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 ${
              active ? "bg-indigo-950 text-amber-50" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
