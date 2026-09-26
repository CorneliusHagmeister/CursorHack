"use client";

import { usePathname } from "next/navigation";
import { ShopperContextBanner } from "@/components/ShopperContext";

export function ShopperStrip() {
  const pathname = usePathname();
  if (pathname.startsWith("/merchant")) return null;

  return (
    <div className="border-t border-stone-200/60 bg-emerald-50/50">
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
        <ShopperContextBanner compact />
      </div>
    </div>
  );
}
