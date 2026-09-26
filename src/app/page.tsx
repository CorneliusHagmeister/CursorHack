import { Suspense } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CatalogueFilters } from "@/components/CatalogueFilters";
import { searchProducts } from "@/lib/products";
import { resolveShopperContext, hasPersonalContext } from "@/lib/context";
import { gbp } from "@/lib/format";
import type { Condition, ProductFilters } from "@/lib/types";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const filters: ProductFilters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    waist: sp.waist ? Number(sp.waist) : undefined,
    brand: typeof sp.brand === "string" ? sp.brand : undefined,
    condition:
      typeof sp.condition === "string"
        ? (sp.condition as Condition)
        : undefined,
    cut: typeof sp.cut === "string" ? sp.cut : undefined,
    maxPrice: sp.max_price ? Number(sp.max_price) : undefined,
  };

  const products = searchProducts(filters);
  const ctx = await resolveShopperContext({ searchParams: sp });
  const shopper = hasPersonalContext(ctx) ? ctx.shopper : undefined;
  const firstName = shopper?.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Second-hand denim
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {shopper && firstName ? (
            <>
              {firstName} wears W{shopper.waist} and shops up to {gbp(shopper.budgetMax)}.{" "}
              <Link
                href={`/?waist=${shopper.waist}&max_price=${shopper.budgetMax}`}
                className="underline"
              >
                Show my size
              </Link>
              {" · "}
            </>
          ) : null}
          {products.length} pairs · UK sellers
        </p>
      </div>

      <Suspense fallback={null}>
        <CatalogueFilters />
      </Suspense>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-12 text-center text-sm text-stone-500">
          No pairs match those filters.
        </p>
      )}
    </div>
  );
}
