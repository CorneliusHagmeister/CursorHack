import Link from "next/link";
import { X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { CatalogueFilters } from "@/components/CatalogueFilters";
import { listProducts } from "@/lib/products";
import {
  appliedFilters,
  bestFilterToDrop,
  buildFacets,
  catalogueHref,
  filterCatalogue,
  parseCatalogueQuery,
  sortCatalogue,
  sortOptions,
} from "@/lib/catalogue";
import { resolveShopperContext, hasPersonalContext } from "@/lib/context";
import { gbp } from "@/lib/format";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const ctx = await resolveShopperContext({ searchParams: sp });
  const shopper = hasPersonalContext(ctx) ? ctx.shopper : undefined;
  const firstName = shopper?.name.split(" ")[0];

  const catalogue = listProducts();
  const query = parseCatalogueQuery(sp);
  const products = sortCatalogue(filterCatalogue(catalogue, query), query, shopper);
  const facets = buildFacets(catalogue, query, shopper);
  const applied = appliedFilters(query);
  const sorts = sortOptions(query, shopper);
  const fallback = products.length === 0 ? bestFilterToDrop(catalogue, query) : undefined;
  const clearHref = catalogueHref({ waists: [], brands: [], cuts: [], conditions: [], sort: query.sort });
  const filterProps = { facets, shopperWaist: shopper?.waist, budgetMax: shopper?.budgetMax };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
        Second-hand denim
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {shopper && firstName ? (
          <>
            {firstName} wears W{shopper.waist} and shops up to {gbp(shopper.budgetMax)}.{" "}
            <Link
              href={catalogueHref({
                waists: [shopper.waist],
                brands: [],
                cuts: [],
                conditions: [],
                maxPrice: shopper.budgetMax,
              })}
              className="underline"
            >
              Show my size
            </Link>
          </>
        ) : (
          `${catalogue.length} pairs from UK sellers`
        )}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-20">
            <CatalogueFilters idPrefix="side" {...filterProps} />
          </div>
        </aside>

        <div className="min-w-0">
          <details className="group lg:hidden">
            <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
              <span className="group-open:hidden">Filters</span>
              <span className="hidden group-open:inline">Hide filters</span>
              {applied.length > 0 && <span className="ml-1.5 tabular-nums text-stone-500">{applied.length}</span>}
            </summary>
            <div className="mt-4 pb-2">
              <CatalogueFilters idPrefix="sheet" {...filterProps} />
            </div>
          </details>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 lg:mt-0">
            <p className="text-sm text-stone-600" aria-live="polite">
              Showing {products.length} of {catalogue.length} pairs
            </p>
            <nav aria-label="Sort" className="-mx-1 overflow-x-auto px-1">
              <div className="inline-flex rounded-full bg-stone-100 p-0.5">
                {sorts.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    scroll={false}
                    aria-current={option.active ? "true" : undefined}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                      option.active ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {applied.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {applied.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  scroll={false}
                  aria-label={`Remove ${filter.label}`}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-300 py-1 pl-3 pr-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  {filter.label}
                  <X className="h-3 w-3 text-stone-500" aria-hidden />
                </Link>
              ))}
              <Link href={clearHref} scroll={false} className="px-1 text-xs text-stone-500 underline">
                Clear all
              </Link>
            </div>
          )}

          {products.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center text-sm text-stone-600">
              <p>No pairs match all of those.</p>
              {fallback ? (
                <p className="mt-2">
                  <Link href={fallback.href} className="underline">
                    Drop {fallback.label}
                  </Link>{" "}
                  to see {fallback.count} {fallback.count === 1 ? "pair" : "pairs"}.
                </p>
              ) : (
                <p className="mt-2">
                  <Link href={clearHref} className="underline">
                    Clear filters
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
