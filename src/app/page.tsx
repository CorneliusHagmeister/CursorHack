import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { CatalogueFilters } from "@/components/CatalogueFilters";
import { HomeHero } from "@/components/HomeHero";
import { searchProducts } from "@/lib/products";
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
  // The pitch only greets a fresh visit; searches and filters go straight to results
  const browsing = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {!browsing && <HomeHero />}

      <div id="shop" className={`mb-6 scroll-mt-24 ${browsing ? "" : "pt-12"}`}>
        {browsing ? (
          <h1 className="font-slab text-3xl font-bold text-rinse">In the shop</h1>
        ) : (
          <h2 className="font-slab text-3xl font-bold text-rinse">In the shop</h2>
        )}
        <p className="mt-1 text-sm text-stone-500">
          {products.length} {products.length === 1 ? "item" : "items"}, all open to offers
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
          Nothing matches those filters. Clear one to see more.
        </p>
      )}
    </div>
  );
}
