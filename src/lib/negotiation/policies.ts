import { promises as fs } from "fs";
import path from "path";
import { getPerkOptions, getProduct, listProducts } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import type {
  ExtraId,
  PricingContext,
  Priority,
  ProductPolicy,
  RiskLevel,
  TermId,
} from "./types";

/** Buyer commitments the merchant can trade price for */
export const TERM_CATALOG: { id: TermId; label: string }[] = [
  { id: "final_sale", label: "Final sale — no returns" },
  { id: "store_credit", label: "Store credit instead of a refund if you return it" },
  { id: "standard_shipping", label: "Standard 5-day shipping instead of next-day" },
  { id: "fit_review", label: "Post a fit review with photos within 14 days" },
  { id: "collect_london", label: "Collect in person from our London studio" },
];
export const TERM_IDS: TermId[] = TERM_CATALOG.map((t) => t.id);

/** Value the merchant can add instead of cutting price */
export const EXTRA_CATALOG: { id: ExtraId; label: string }[] = [
  { id: "free_hemming", label: "Free hemming to your inseam" },
];
export const EXTRA_IDS: ExtraId[] = EXTRA_CATALOG.map((e) => e.id);

const DEFAULT_MAX_DISCOUNT = 0.2;
const DEFAULT_MAX_DISCOUNT_BY_ID: Record<string, number> = {
  "apc-petit-new": 0.15, // hero pair, holds value
  "nudie-lean-dean": 0.18,
  "wrangler-texas": 0.25,
  "levi-550-relaxed": 0.3, // been on the rail a while
};
const DEFAULT_PRIORITY: Record<string, Priority> = {
  "apc-petit-new": "hold",
  "levi-550-relaxed": "clear",
  "uniqlo-wide": "clear",
};
const DEFAULT_RETURN_RISK: Record<string, RiskLevel> = {
  "nudie-lean-dean": "high", // dry slim denim, fit is a gamble
  "apc-petit-new": "high", // raw denim shrinks
  "levi-550-relaxed": "low",
};
/** What final sale is worth, as a share of list, by how often an item comes back */
const FINAL_SALE_SHARE: Record<RiskLevel, number> = { low: 0.04, medium: 0.07, high: 0.11 };

export function finalSaleWorth(product: Product, risk: RiskLevel): number {
  return Math.max(1, Math.round(product.price * FINAL_SALE_SHARE[risk]));
}

export function defaultPolicy(product: Product): ProductPolicy {
  const maxDiscount = DEFAULT_MAX_DISCOUNT_BY_ID[product.id] ?? DEFAULT_MAX_DISCOUNT;
  const floorPrice = Math.ceil(product.price * (1 - maxDiscount));
  const returnRisk = DEFAULT_RETURN_RISK[product.id] ?? "medium";
  const eligible = getPerkOptions(product.id);
  return {
    negotiable: true,
    // Aim to keep about half of the room we have
    targetPrice: Math.round(product.price - (product.price - floorPrice) / 2),
    floorPrice,
    priority: DEFAULT_PRIORITY[product.id] ?? (product.perkEligible ? "clear" : "normal"),
    clearBy: null,
    returnRisk,
    highValue: false,
    terms: {
      final_sale: { enabled: true, discount: finalSaleWorth(product, returnRisk) },
      // Credit keeps the money in the shop, so worth about half of no returns at all
      store_credit: { enabled: true, discount: Math.max(1, Math.round(finalSaleWorth(product, returnRisk) / 2)) },
      standard_shipping: { enabled: true, discount: 4 },
      fit_review: { enabled: true, discount: Math.max(1, Math.round(product.price * 0.05)) },
      collect_london: { enabled: product.city === "London", discount: 3 },
    },
    extras: {
      free_hemming: { enabled: true, cost: 4, value: 12 },
    },
    // Free pairs are a merchant decision, not a default: off until switched on
    // per item, and then limited to cheap overstock we'd happily give away
    perkEnabled: false,
    perkIds: eligible.filter((p) => p.price <= 20).map((p) => p.id),
    pushPerkIds: eligible.filter((p) => p.price <= 20).map((p) => p.id),
    sellingPoints: "",
    avoidSaying: "",
  };
}

/** Merge onto defaults, clamp and sanitise against the product */
export function normalizePolicy(product: Product, input: Partial<ProductPolicy>): ProductPolicy {
  const d = defaultPolicy(product);
  const money = (n: unknown, fallback: number, max = product.price) => {
    const v = Math.round(Number(n ?? fallback));
    return Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : fallback;
  };
  const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
    options.includes(v as T) ? (v as T) : fallback;
  const eligible = new Set(getPerkOptions(product.id).map((p) => p.id));

  const floorPrice = Math.max(1, money(input.floorPrice, d.floorPrice));
  const targetPrice = Math.min(product.price, Math.max(floorPrice, money(input.targetPrice, d.targetPrice)));
  return {
    negotiable: input.negotiable ?? d.negotiable,
    targetPrice,
    floorPrice,
    priority: oneOf(input.priority, ["hold", "normal", "clear"] as const, d.priority),
    clearBy: typeof input.clearBy === "string" && /^\d{4}-\d{2}-\d{2}/.test(input.clearBy) ? input.clearBy.slice(0, 10) : null,
    returnRisk: oneOf(input.returnRisk, ["low", "medium", "high"] as const, d.returnRisk),
    highValue: Boolean(input.highValue ?? d.highValue),
    terms: Object.fromEntries(
      TERM_IDS.map((id) => [
        id,
        {
          enabled: Boolean(input.terms?.[id]?.enabled ?? d.terms[id].enabled),
          discount: money(input.terms?.[id]?.discount, d.terms[id].discount),
        },
      ])
    ) as ProductPolicy["terms"],
    extras: Object.fromEntries(
      EXTRA_IDS.map((id) => [
        id,
        {
          enabled: Boolean(input.extras?.[id]?.enabled ?? d.extras[id].enabled),
          cost: money(input.extras?.[id]?.cost, d.extras[id].cost),
          value: money(input.extras?.[id]?.value, d.extras[id].value),
        },
      ])
    ) as ProductPolicy["extras"],
    perkEnabled: Boolean(input.perkEnabled ?? d.perkEnabled),
    perkIds: Array.isArray(input.perkIds) ? input.perkIds.filter((id) => eligible.has(id)) : null,
    pushPerkIds: Array.isArray(input.pushPerkIds)
      ? input.pushPerkIds.filter((id) => eligible.has(id))
      : d.pushPerkIds,
    sellingPoints: String(input.sellingPoints ?? "").slice(0, 500),
    avoidSaying: String(input.avoidSaying ?? "").slice(0, 300),
  };
}

// Supabase (il_negotiation_policies, service role only) when configured,
// otherwise data/policies.json, memory-only on read-only hosts.
const TABLE = "il_negotiation_policies";
const FILE = path.join(process.cwd(), "data", "policies.json");
const g = globalThis as unknown as { __policies?: Record<string, ProductPolicy> };

async function loadAll(): Promise<Record<string, ProductPolicy>> {
  const db = createAdminClient();
  if (db) {
    const { data, error } = await db.from(TABLE).select("product_id, policy");
    if (!error) {
      return Object.fromEntries((data ?? []).map((r) => [r.product_id, r.policy as ProductPolicy]));
    }
    console.error("policies: Supabase read failed, using local store", error.message);
  }
  return loadLocal();
}

async function writeOne(productId: string, policy: ProductPolicy | null): Promise<void> {
  const db = createAdminClient();
  if (db) {
    const { error } = policy
      ? await db.from(TABLE).upsert({ product_id: productId, policy, updated_at: new Date().toISOString() })
      : await db.from(TABLE).delete().eq("product_id", productId);
    if (!error) return;
    console.error("policies: Supabase write failed, using local store", error.message);
  }
  const all = { ...(await loadLocal()) };
  if (policy) all[productId] = policy;
  else delete all[productId];
  g.__policies = all;
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {
    // read-only FS — keep in memory
  }
}

async function loadLocal(): Promise<Record<string, ProductPolicy>> {
  if (g.__policies) return g.__policies;
  try {
    g.__policies = JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    g.__policies = {};
  }
  return g.__policies!;
}

export async function getPolicy(product: Product): Promise<ProductPolicy> {
  const saved = (await loadAll())[product.id];
  return saved ? normalizePolicy(product, saved) : defaultPolicy(product);
}

export async function getPricingContext(productId: string): Promise<PricingContext | null> {
  const product = getProduct(productId);
  return product ? { product, policy: await getPolicy(product) } : null;
}

export async function listPolicies(): Promise<PricingContext[]> {
  const saved = await loadAll();
  return listProducts().map((product) => ({
    product,
    policy: saved[product.id] ? normalizePolicy(product, saved[product.id]) : defaultPolicy(product),
  }));
}

export async function savePolicy(product: Product, input: Partial<ProductPolicy>): Promise<ProductPolicy> {
  const policy = normalizePolicy(product, input);
  await writeOne(product.id, policy);
  return policy;
}

export async function resetPolicy(product: Product): Promise<ProductPolicy> {
  await writeOne(product.id, null);
  return defaultPolicy(product);
}
