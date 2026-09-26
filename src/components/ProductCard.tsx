"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { gbp } from "@/lib/format";

export function productAlt(
  product: Pick<Product, "brand" | "name" | "wash" | "cut">
) {
  return `${product.brand} ${product.name}, ${product.wash.toLowerCase()} ${product.cut.toLowerCase()}`;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Image
          src={product.image}
          alt={productAlt(product)}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-[cubic-bezier(0.19,1,0.22,1)] motion-safe:group-hover:scale-[1.02]"
        />
        <span
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-500 shadow-sm"
          aria-hidden
        >
          <Heart className="h-4 w-4" />
        </span>
        {product.perkEligible && (
          <span className="absolute bottom-2 left-2 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">
            Bundle eligible
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pt-2">
        <p className="text-sm font-medium text-stone-900">{product.brand}</p>
        <p className="text-xs text-stone-500">
          W{product.waist} · {product.condition}
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-stone-900">
          {gbp(product.price)}
        </p>
      </div>
    </Link>
  );
}
