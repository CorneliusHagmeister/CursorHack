import { PRODUCTS, getProduct } from "./products";
import type { AssistRequest, Condition, Product } from "./types";

const CONDITION_RANK: Record<Condition, number> = {
  Fair: 1,
  Good: 2,
  "Very Good": 3,
  Excellent: 4,
  "Like New": 5,
};

function scoreProduct(
  p: Product,
  waist?: number,
  minCondition?: Condition
): number {
  let score = 0;
  if (waist != null) {
    const delta = Math.abs(p.waist - waist);
    if (delta === 0) score += 40;
    else if (delta === 1) score += 28;
    else if (delta === 2) score += 16;
    else if (delta <= 4) score += 6;
    else score -= 20;
  }
  if (minCondition) {
    if (CONDITION_RANK[p.condition] >= CONDITION_RANK[minCondition]) score += 20;
    else score -= 10;
  }
  if (!p.perkEligible) score += 5;
  score += Math.min(p.price / 5, 15);
  return score;
}

function formatProduct(p: Product): string {
  return `${p.brand} ${p.name}, W${p.waist} L${p.length}, ${p.condition}, ${p.wash}, £${p.price} (${p.city})`;
}

export function runAssist(req: AssistRequest): {
  reply: string;
  matches: Product[];
} {
  const msg = req.message.toLowerCase();
  const waist =
    req.waist ??
    (() => {
      const m = msg.match(/\b(?:w(?:aist)?\s*)?(\d{2})\b/);
      return m ? Number(m[1]) : undefined;
    })();

  let preferredCondition: Condition | undefined = req.preferredCondition;
  if (!preferredCondition) {
    if (/like\s*new/.test(msg)) preferredCondition = "Like New";
    else if (/excellent/.test(msg)) preferredCondition = "Excellent";
    else if (/very\s*good/.test(msg)) preferredCondition = "Very Good";
    else if (/\bfair\b/.test(msg)) preferredCondition = "Fair";
    else if (/\bgood\b/.test(msg)) preferredCondition = "Good";
  }

  if (req.productId) {
    const primary = getProduct(req.productId);
    if (primary) {
      const perks = PRODUCTS.filter(
        (p) =>
          p.perkEligible &&
          p.id !== primary.id &&
          p.price < primary.price &&
          Math.abs(p.waist - (waist ?? primary.waist)) <= 4
      ).slice(0, 3);
      const reply = [
        `For **${primary.brand} ${primary.name}** (W${primary.waist}), here's a size/condition read:`,
        ``,
        `Listed condition ${primary.condition}. ${primary.description}`,
        waist != null
          ? `Your waist ${waist} vs listed ${primary.waist}. ${
              Math.abs(waist - primary.waist) <= 1
                ? "Close match. Expect true to size."
                : Math.abs(waist - primary.waist) <= 2
                  ? "Slight gap. Check the cut, relaxed or slim."
                  : "Notable gap. I'd pick another waist."
            }`
          : `Tell me your waist and I'll tighten the fit advice.`,
        ``,
        perks.length
          ? `**Pair & Perk** unlocks (free add-ons if you pay full price on this pair):\n` +
            perks.map((p) => `• ${formatProduct(p)}`).join("\n")
          : `No free perk options match this waist. Browse other hero pairs.`,
        ``,
        `Demo tip: ask "W32 excellent black" or "what pairs with this?"`,
      ].join("\n");
      return { reply, matches: perks };
    }
  }

  const ranked = [...PRODUCTS]
    .map((p) => ({ p, s: scoreProduct(p, waist, preferredCondition) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map(({ p }) => p);

  const wantsPerk = /perk|free|bundle|addon|add-on|complement/.test(msg);
  const pool = wantsPerk
    ? ranked.filter((p) => p.perkEligible).concat(ranked).slice(0, 4)
    : ranked;

  const unique: Product[] = [];
  for (const p of pool) {
    if (!unique.find((u) => u.id === p.id)) unique.push(p);
  }

  const intro =
    waist != null || preferredCondition
      ? `Matched on ${[
          waist != null ? `waist ~${waist}` : null,
          preferredCondition ? `condition ≥ ${preferredCondition}` : null,
        ]
          .filter(Boolean)
          .join(", ")}:`
      : `Strong picks from today's Indigo Lane catalogue:`;

  const reply = [
    intro,
    ``,
    ...unique.map((p, i) => `${i + 1}. ${formatProduct(p)}`),
    ``,
    wantsPerk
      ? `Pair & Perk: pay full price on a hero pair, then claim one complementary perk pair free at checkout.`
      : `Want a free complementary pair? Ask about Pair & Perk, or open a product and use New Ways to Buy.`,
  ].join("\n");

  return { reply, matches: unique };
}
