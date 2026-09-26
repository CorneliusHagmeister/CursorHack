import type { Product } from "./types";

/** Seed catalogue — UK second-hand denim, believable GBP prices */
export const PRODUCTS: Product[] = [
  {
    id: "levi-501-indigo",
    name: "501 Original Fit",
    brand: "Levi's",
    price: 48,
    waist: 32,
    length: 32,
    wash: "Dark indigo",
    cut: "Straight",
    condition: "Good",
    description:
      "Classic button-fly 501s from a Camden seller. Softened through the thigh, strong indigo still left in the fold.",
    city: "London",
    perkEligible: false,
    accent: "#1e3a5f",
    tags: ["iconic", "straight", "everyday"],
  },
  {
    id: "wrangler-texas",
    name: "Texas Straight",
    brand: "Wrangler",
    price: 36,
    waist: 30,
    length: 34,
    wash: "Medium blue",
    cut: "Straight",
    condition: "Excellent",
    description:
      "Western-cut Wranglers with barely-there wear. Ideal daily denim; hem ready for boots.",
    city: "Manchester",
    perkEligible: false,
    accent: "#2c5282",
    tags: ["western", "tall", "sturdy"],
  },
  {
    id: "nudie-lean-dean",
    name: "Lean Dean Organic",
    brand: "Nudie Jeans",
    price: 55,
    waist: 31,
    length: 32,
    wash: "Dry black",
    cut: "Slim taper",
    condition: "Very Good",
    description:
      "Organic dry black Lean Deans. One owner, no fades yet — blank canvas for your own wear pattern.",
    city: "Bristol",
    perkEligible: false,
    accent: "#111827",
    tags: ["premium", "slim", "organic"],
  },
  {
    id: "carhartt-pontiac",
    name: "Pontiac Pant",
    brand: "Carhartt WIP",
    price: 42,
    waist: 33,
    length: 32,
    wash: "Stonewashed",
    cut: "Relaxed taper",
    condition: "Good",
    description:
      "Workwear DNA, city soft. Double knees still intact; great with a chore jacket.",
    city: "Leeds",
    perkEligible: false,
    accent: "#3d4f5f",
    tags: ["workwear", "relaxed", "layer"],
  },
  {
    id: "dickies-872",
    name: "872 Slim Fit Work Pant",
    brand: "Dickies",
    price: 28,
    waist: 28,
    length: 30,
    wash: "Rinsed indigo",
    cut: "Slim",
    condition: "Like New",
    description:
      "Barely worn 872s — crisp rinse, factory crease still visible. Compact waist, short inseam.",
    city: "Brighton",
    perkEligible: true,
    accent: "#2563eb",
    tags: ["slim", "work", "perk"],
  },
  {
    id: "uniqlo-wide",
    name: "Wide Fit Jeans",
    brand: "Uniqlo",
    price: 18,
    waist: 34,
    length: 32,
    wash: "Light wash",
    cut: "Wide",
    condition: "Good",
    description:
      "Easy weekend wide-legs. Soft cotton denim, light fade on the seat — perfect perk pair.",
    city: "Birmingham",
    perkEligible: true,
    accent: "#7dd3fc",
    tags: ["wide", "casual", "perk"],
  },
  {
    id: "levi-550-relaxed",
    name: "550 Relaxed Fit",
    brand: "Levi's",
    price: 22,
    waist: 36,
    length: 34,
    wash: "Medium stone",
    cut: "Relaxed",
    condition: "Fair",
    description:
      "Broken-in 550s with honest whiskers. Roomier cut; great as a free complementary pair.",
    city: "Glasgow",
    perkEligible: true,
    accent: "#60a5fa",
    tags: ["relaxed", "vintage-feel", "perk"],
  },
  {
    id: "apc-petit-new",
    name: "Petit New Standard",
    brand: "A.P.C.",
    price: 95,
    waist: 30,
    length: 32,
    wash: "Raw indigo",
    cut: "Slim straight",
    condition: "Excellent",
    description:
      "Paris raw denim, UK seller. Unwashed, stiff hand — the hero pair for a Pair & Perk unlock.",
    city: "London",
    perkEligible: false,
    accent: "#0f172a",
    tags: ["raw", "premium", "hero"],
  },
  {
    id: "weekday-ace",
    name: "Ace Organic Cotton",
    brand: "Weekday",
    price: 32,
    waist: 29,
    length: 30,
    wash: "Vintage blue",
    cut: "Regular taper",
    condition: "Very Good",
    description:
      "Soft organic Ace jeans with a lived-in vintage wash. Mid-rise, easy everyday taper.",
    city: "Edinburgh",
    perkEligible: false,
    accent: "#1d4ed8",
    tags: ["organic", "everyday", "taper"],
  },
  {
    id: "lee-101-z",
    name: "101 Z Rider",
    brand: "Lee",
    price: 38,
    waist: 32,
    length: 34,
    wash: "Rinse blue",
    cut: "Straight",
    condition: "Good",
    description:
      "Lee heritage riders with a clean rinse. Longer inseam — works with trainers or boots.",
    city: "Liverpool",
    perkEligible: false,
    accent: "#1e40af",
    tags: ["heritage", "straight", "tall"],
  },
  {
    id: "edwin-ed55",
    name: "ED-55 Regular Tapered",
    brand: "Edwin",
    price: 45,
    waist: 31,
    length: 34,
    wash: "Blue rinsed",
    cut: "Regular taper",
    condition: "Excellent",
    description:
      "Japanese denim, UK warehouse. Crisp ED-55 with room through the thigh and a clean taper.",
    city: "London",
    perkEligible: false,
    accent: "#172554",
    tags: ["japanese", "taper", "premium"],
  },
  {
    id: "ms-autograph",
    name: "Autograph Slim Jeans",
    brand: "M&S",
    price: 16,
    waist: 34,
    length: 30,
    wash: "Dark rinse",
    cut: "Slim",
    condition: "Like New",
    description:
      "Nearly new Autograph slim jeans. Dark enough for smart-casual; ideal free add-on.",
    city: "Cardiff",
    perkEligible: true,
    accent: "#334155",
    tags: ["slim", "smart", "perk"],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function listProducts(): Product[] {
  return PRODUCTS;
}

/** Complementary perk candidates for a primary purchase */
export function getPerkOptions(primaryId: string): Product[] {
  const primary = getProduct(primaryId);
  if (!primary) return [];
  return PRODUCTS.filter(
    (p) =>
      p.id !== primaryId &&
      p.perkEligible &&
      p.price < primary.price &&
      Math.abs(p.waist - primary.waist) <= 4
  );
}
