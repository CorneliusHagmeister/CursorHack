import { promises as fs } from "fs";
import path from "path";
import { getPerkOptions, getProduct, listProducts } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import type { PricingContext, ProductPolicy, TermId } from "./types";

/** The give-gets a merchant can offer; values below are the defaults */
export const TERM_CATALOG: { id: TermId; label: string; share?: number; flat?: number }[] = [
  { id: "final_sale", label: "Final sale — no returns", share: 0.08 },
  { id: "standard_shipping", label: "Standard 5-day shipping instead of next-day", flat: 4 },
  { id: "fit_review", label: "Post a fit review with photos within 14 days", share: 0.06 },
];
export const TERM_IDS: TermId[] = TERM_CATALOG.map((t) => t.id);

const DEFAULT_MAX_DISCOUNT = 0.2;
const DEFAULT_MAX_DISCOUNT_BY_ID: Record<string, number> = {
  "apc-petit-new": 0.15, // hero pair, holds value
  "nudie-lean-dean": 0.18,
  "wrangler-texas": 0.25,
  "levi-550-relaxed": 0.3, // been on the rail a while
};

export function defaultPolicy(product: Product): ProductPolicy {
  const maxDiscount = DEFAULT_MAX_DISCOUNT_BY_ID[product.id] ?? DEFAULT_MAX_DISCOUNT;
  return {
    negotiable: true,
    floorPrice: Math.ceil(product.price * (1 - maxDiscount)),
    terms: Object.fromEntries(
      TERM_CATALOG.map((t) => [
        t.id,
        { enabled: true, discount: Math.max(1, t.flat ?? Math.round(product.price * (t.share ?? 0))) },
      ])
    ) as ProductPolicy["terms"],
    perkEnabled: true,
    perkIds: null,
    sellingPoints: "",
  };
}

/** Clamp and sanitise a policy against its product; throws on unusable input */
export function normalizePolicy(product: Product, input: ProductPolicy): ProductPolicy {
  const money = (n: unknown, max: number) => {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) throw new Error("Prices must be numbers");
    return Math.min(max, Math.max(0, v));
  };
  const eligible = new Set(getPerkOptions(product.id).map((p) => p.id));
  return {
    negotiable: Boolean(input.negotiable),
    floorPrice: Math.max(1, money(input.floorPrice, product.price)),
    terms: Object.fromEntries(
      TERM_IDS.map((id) => [
        id,
        {
          enabled: Boolean(input.terms?.[id]?.enabled),
          discount: money(input.terms?.[id]?.discount ?? 0, product.price),
        },
      ])
    ) as ProductPolicy["terms"],
    perkEnabled: Boolean(input.perkEnabled),
    perkIds: Array.isArray(input.perkIds)
      ? input.perkIds.filter((id) => eligible.has(id))
      : null,
    sellingPoints: String(input.sellingPoints ?? "").slice(0, 500),
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

export async function savePolicy(product: Product, input: ProductPolicy): Promise<ProductPolicy> {
  const policy = normalizePolicy(product, input);
  await writeOne(product.id, policy);
  return policy;
}

export async function resetPolicy(product: Product): Promise<ProductPolicy> {
  await writeOne(product.id, null);
  return defaultPolicy(product);
}
