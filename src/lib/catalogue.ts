import { gbp } from "./format";
import type { Condition, Product, ShopperProfile } from "./types";

/** Newest to most worn. */
export const CONDITION_ORDER: Condition[] = ["Like New", "Excellent", "Very Good", "Good", "Fair"];

/** Cut families match by substring, so "Slim straight" counts as both Slim and Straight. */
export const CUT_FAMILIES = ["Straight", "Slim", "Taper", "Relaxed", "Wide"] as const;

const PRICE_CAPS = [40, 60, 90];

export type SortKey = "featured" | "fit" | "value" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  fit: "Fits you",
  value: "Best value",
  "price-asc": "Lowest price",
  "price-desc": "Highest price",
};

export type CatalogueQuery = {
  q?: string;
  waists: number[];
  brands: string[];
  cuts: string[];
  conditions: Condition[];
  maxPrice?: number;
  sort?: SortKey;
};

type FilterKey = "q" | "waists" | "brands" | "cuts" | "conditions" | "maxPrice";

export type FacetOption = {
  label: string;
  count: number;
  active: boolean;
  href: string;
};

export type CatalogueFacets = {
  waists: (FacetOption & { value: number })[];
  cuts: FacetOption[];
  brands: FacetOption[];
  conditions: FacetOption[];
  prices: (FacetOption & { value: number })[];
};

export type AppliedFilter = { key: string; label: string; href: string };

type RawSearch = Record<string, string | string[] | undefined>;

const listParam = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean);

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const parseCatalogueQuery = (search: RawSearch): CatalogueQuery => {
  const maxPrice = Number(firstParam(search.max_price));
  const sort = firstParam(search.sort) as SortKey | undefined;
  return {
    q: firstParam(search.q)?.trim() || undefined,
    waists: listParam(search.waist).map(Number).filter(Number.isFinite),
    brands: listParam(search.brand),
    cuts: listParam(search.cut),
    conditions: listParam(search.condition).filter((c): c is Condition =>
      CONDITION_ORDER.includes(c as Condition)
    ),
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    sort: sort && sort in SORT_LABELS ? sort : undefined,
  };
};

const matchesCut = (product: Product, cut: string) =>
  product.cut.toLowerCase().includes(cut.toLowerCase());

/** Lenient so hand-typed links like ?brand=levi still work. */
const matchesBrand = (product: Product, brand: string) =>
  product.brand.toLowerCase().includes(brand.toLowerCase());

const matchesQuery = (product: Product, q: string) =>
  `${product.brand} ${product.name} ${product.wash} ${product.cut} ${product.city} ${product.tags.join(" ")}`
    .toLowerCase()
    .includes(q.toLowerCase());

/** Values inside one group widen the results; groups narrow each other. `skip` ignores one group, for its own counts. */
const matches = (product: Product, query: CatalogueQuery, skip?: FilterKey) => {
  if (skip !== "q" && query.q && !matchesQuery(product, query.q)) return false;
  if (skip !== "waists" && query.waists.length && !query.waists.includes(product.waist)) return false;
  if (skip !== "brands" && query.brands.length && !query.brands.some((brand) => matchesBrand(product, brand)))
    return false;
  if (skip !== "cuts" && query.cuts.length && !query.cuts.some((cut) => matchesCut(product, cut)))
    return false;
  if (skip !== "conditions" && query.conditions.length && !query.conditions.includes(product.condition))
    return false;
  if (skip !== "maxPrice" && query.maxPrice != null && product.price > query.maxPrice) return false;
  return true;
};

export const filterCatalogue = (products: Product[], query: CatalogueQuery) =>
  products.filter((product) => matches(product, query));

export const catalogueHref = (query: CatalogueQuery) => {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.waists.length) params.set("waist", query.waists.join(","));
  if (query.brands.length) params.set("brand", query.brands.join(","));
  if (query.cuts.length) params.set("cut", query.cuts.join(","));
  if (query.conditions.length) params.set("condition", query.conditions.join(","));
  if (query.maxPrice != null) params.set("max_price", String(query.maxPrice));
  if (query.sort) params.set("sort", query.sort);
  const search = params.toString();
  return search ? `/?${search}` : "/";
};

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const countWith = (products: Product[], query: CatalogueQuery, key: FilterKey, test: (p: Product) => boolean) =>
  products.filter((product) => matches(product, query, key) && test(product)).length;

export const buildFacets = (
  products: Product[],
  query: CatalogueQuery,
  shopper?: ShopperProfile
): CatalogueFacets => {
  const waists = [...new Set(products.map((p) => p.waist))].sort((a, b) => a - b);
  const brands = [...new Set(products.map((p) => p.brand))];
  const caps = [...new Set([...PRICE_CAPS, ...(shopper ? [shopper.budgetMax] : [])])].sort(
    (a, b) => a - b
  );

  const brandOptions = brands
    .map((brand) => ({
      label: brand,
      count: countWith(products, query, "brands", (p) => p.brand === brand),
      active: query.brands.includes(brand),
      href: catalogueHref({ ...query, brands: toggle(query.brands, brand) }),
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || b.count - a.count || a.label.localeCompare(b.label));

  return {
    waists: waists.map((waist) => ({
      value: waist,
      label: `W${waist}`,
      count: countWith(products, query, "waists", (p) => p.waist === waist),
      active: query.waists.includes(waist),
      href: catalogueHref({ ...query, waists: toggle(query.waists, waist) }),
    })),
    cuts: CUT_FAMILIES.map((cut) => ({
      label: cut,
      count: countWith(products, query, "cuts", (p) => matchesCut(p, cut)),
      active: query.cuts.includes(cut),
      href: catalogueHref({ ...query, cuts: toggle(query.cuts, cut) }),
    })),
    brands: brandOptions,
    conditions: CONDITION_ORDER.map((condition) => ({
      label: condition,
      count: countWith(products, query, "conditions", (p) => p.condition === condition),
      active: query.conditions.includes(condition),
      href: catalogueHref({ ...query, conditions: toggle(query.conditions, condition) }),
    })),
    prices: caps.map((cap) => ({
      value: cap,
      label: `Under ${gbp(cap)}`,
      count: countWith(products, query, "maxPrice", (p) => p.price <= cap),
      active: query.maxPrice === cap,
      href: catalogueHref({ ...query, maxPrice: query.maxPrice === cap ? undefined : cap }),
    })),
  };
};

export const appliedFilters = (query: CatalogueQuery): AppliedFilter[] => [
  ...(query.q
    ? [{ key: "q", label: `“${query.q}”`, href: catalogueHref({ ...query, q: undefined }) }]
    : []),
  ...query.waists.map((waist) => ({
    key: `waist-${waist}`,
    label: `W${waist}`,
    href: catalogueHref({ ...query, waists: toggle(query.waists, waist) }),
  })),
  ...query.cuts.map((cut) => ({
    key: `cut-${cut}`,
    label: cut,
    href: catalogueHref({ ...query, cuts: toggle(query.cuts, cut) }),
  })),
  ...query.brands.map((brand) => ({
    key: `brand-${brand}`,
    label: brand,
    href: catalogueHref({ ...query, brands: toggle(query.brands, brand) }),
  })),
  ...query.conditions.map((condition) => ({
    key: `condition-${condition}`,
    label: condition,
    href: catalogueHref({ ...query, conditions: toggle(query.conditions, condition) }),
  })),
  ...(query.maxPrice != null
    ? [
        {
          key: "max-price",
          label: `Under ${gbp(query.maxPrice)}`,
          href: catalogueHref({ ...query, maxPrice: undefined }),
        },
      ]
    : []),
];

/** The one filter whose removal brings back the most pairs, for the empty state. */
export const bestFilterToDrop = (products: Product[], query: CatalogueQuery) =>
  appliedFilters(query)
    .map((filter) => {
      const url = new URL(filter.href, "http://local");
      const relaxed = parseCatalogueQuery(Object.fromEntries(url.searchParams));
      return { ...filter, count: filterCatalogue(products, relaxed).length };
    })
    .filter((filter) => filter.count > 0)
    .sort((a, b) => b.count - a.count)[0];

export const sortOptions = (query: CatalogueQuery, shopper?: ShopperProfile) => {
  const keys: SortKey[] = [shopper ? "fit" : "featured", "value", "price-asc", "price-desc"];
  const current = effectiveSort(query, shopper);
  return keys.map((key) => ({
    key,
    label: SORT_LABELS[key],
    active: key === current,
    href: catalogueHref({ ...query, sort: key === keys[0] ? undefined : key }),
  }));
};

const effectiveSort = (query: CatalogueQuery, shopper?: ShopperProfile): SortKey =>
  query.sort && (query.sort !== "fit" || shopper) ? query.sort : shopper ? "fit" : "featured";

const conditionScore = (condition: Condition) =>
  CONDITION_ORDER.length - CONDITION_ORDER.indexOf(condition);

export const sortCatalogue = (products: Product[], query: CatalogueQuery, shopper?: ShopperProfile) => {
  const sorted = [...products];
  switch (effectiveSort(query, shopper)) {
    case "fit": {
      if (!shopper) return sorted;
      const overBudget = (p: Product) => Number(p.price > shopper.budgetMax);
      return sorted.sort(
        (a, b) =>
          Math.abs(a.waist - shopper.waist) - Math.abs(b.waist - shopper.waist) ||
          overBudget(a) - overBudget(b) ||
          a.price - b.price
      );
    }
    case "value":
      return sorted.sort((a, b) => conditionScore(b.condition) / b.price - conditionScore(a.condition) / a.price);
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted;
  }
};
