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

const pad = (value: number) => String(value).padStart(2, "0");

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
    <div className="px-3 pb-10 pt-8 sm:pt-12">
      <div className="px-1">
        <p className="text-caps text-ink">
          Denim <span className="tabular-nums text-muted">{pad(products.length)} / {pad(catalogue.length)}</span>
        </p>
        <h1 className="font-display mt-2 text-4xl text-ink sm:text-6xl">Second-hand denim</h1>
        <p className="mt-3 max-w-xl text-sm text-ink">
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
                className="underline underline-offset-2"
              >
                Show my size
              </Link>
            </>
          ) : (
            "Real pairs from UK sellers, photographed as the brand made them."
          )}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-6">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-20 rounded-tile bg-white p-4">
            <CatalogueFilters idPrefix="side" {...filterProps} />
          </div>
        </aside>

        <div className="min-w-0">
          <details className="group rounded-tile bg-white lg:hidden">
            <summary className="text-caps flex cursor-pointer list-none items-center justify-between px-4 py-3 text-ink">
              <span>
                <span className="group-open:hidden">Filters</span>
                <span className="hidden group-open:inline">Hide filters</span>
              </span>
              <span className="tabular-nums text-muted">{pad(applied.length)}</span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <CatalogueFilters idPrefix="sheet" {...filterProps} />
            </div>
          </details>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-tile bg-white px-4 py-2 lg:mt-0">
            <p className="text-caps text-ink" aria-live="polite">
              Showing{" "}
              <span className="tabular-nums text-muted">
                {pad(products.length)} / {pad(catalogue.length)}
              </span>
            </p>
            <nav aria-label="Sort" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
              <div className="flex gap-1">
                {sorts.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    scroll={false}
                    aria-current={option.active ? "true" : undefined}
                    className={`text-caps whitespace-nowrap rounded-tile px-2 py-1.5 ${
                      option.active ? "bg-ink text-white" : "text-muted hover:text-ink"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {applied.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1">
              {applied.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  scroll={false}
                  aria-label={`Remove ${filter.label}`}
                  className="text-caps inline-flex items-center gap-1 rounded-tile bg-white py-1.5 pl-2.5 pr-2 text-ink hover:bg-hairline"
                >
                  {filter.label}
                  <X className="h-3 w-3 text-muted" aria-hidden />
                </Link>
              ))}
              <Link href={clearHref} scroll={false} className="text-caps px-1.5 text-muted underline underline-offset-2">
                Clear all
              </Link>
            </div>
          )}

          {products.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-tile bg-hairline sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p, index) => (
                <ProductCard key={p.id} product={p} position={index + 1} />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-tile bg-white px-4 py-16 text-center">
              <p className="text-caps text-ink">No pairs match all of those</p>
              {fallback ? (
                <p className="mt-2 text-sm text-ink">
                  <Link href={fallback.href} className="underline underline-offset-2">
                    Drop {fallback.label}
                  </Link>{" "}
                  to see {fallback.count} {fallback.count === 1 ? "pair" : "pairs"}.
                </p>
              ) : (
                <p className="mt-2 text-sm">
                  <Link href={clearHref} className="underline underline-offset-2">
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
