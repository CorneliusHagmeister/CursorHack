import Link from "next/link";
import type { Product } from "@/lib/types";
import { gbp } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${product.accent} 0%, #0f172a 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)",
          }}
        />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
            W{product.waist} / L{product.length}
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
            {product.condition}
          </span>
          {product.perkEligible && (
            <span className="rounded-full bg-amber-300/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-950">
              Perk
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-stone-500">
          {product.brand} · {product.city}
        </p>
        <h3 className="text-base font-semibold text-indigo-950 group-hover:text-indigo-800">
          {product.name}
        </h3>
        <p className="text-sm text-stone-600">
          {product.cut} · {product.wash}
        </p>
        <p className="mt-auto pt-2 text-lg font-semibold tabular-nums text-indigo-950">
          {gbp(product.price)}
        </p>
      </div>
    </Link>
  );
}
