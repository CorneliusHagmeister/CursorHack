import { getPerkOptions, getProduct } from "./products";
import { getShopper } from "./shopper";
import type {
  NegotiatedDeal,
  NegotiateRequest,
  NegotiateResponse,
  Product,
} from "./types";
import { gbp } from "./format";

function pickPerk(primary: Product, preferBrand?: string): Product | null {
  const opts = getPerkOptions(primary.id);
  if (!opts.length) return null;
  const shopper = getShopper();
  const byWaist = [...opts].sort(
    (a, b) =>
      Math.abs(a.waist - shopper.waist) - Math.abs(b.waist - shopper.waist)
  );
  if (preferBrand) {
    const hit = byWaist.find((p) =>
      p.brand.toLowerCase().includes(preferBrand.toLowerCase())
    );
    if (hit) return hit;
  }
  return byWaist[0] ?? null;
}

function baseDeal(primary: Product, perk: Product | null): NegotiatedDeal {
  return {
    primaryId: primary.id,
    perkId: perk?.id ?? null,
    listPrice: primary.price,
    negotiatedPrice: primary.price,
    perkLabel: perk ? `${perk.brand} ${perk.name} (free)` : null,
    summary: perk
      ? `Pair & Perk: ${primary.brand} at full ${gbp(primary.price)} + free ${perk.brand}`
      : `Full price ${primary.brand} at ${gbp(primary.price)}`,
    concessions: [],
  };
}

function intent(msg: string) {
  const m = msg.toLowerCase();
  return {
    greets: /^(hi|hey|hello|yo)\b/.test(m) || m.length < 3,
    tooPricey:
      /too (much|pricey|expensive)|cheaper|discount|knock|off|lower|reduce|cut/.test(
        m
      ) || /£\s*\d+/.test(m) || /\d+\s*(quid|pounds?)/.test(m),
    betterPerk:
      /better perk|different perk|swap perk|another perk|upgrade perk|include|add.?on|free pair/.test(
        m
      ),
    condition:
      /condition|worn|fade|fair|excellent|like new|quality/.test(m),
    accept:
      /deal|accept|take it|let.?s go|lock|checkout|buy|i.?ll take|sold|yes please|apply/.test(
        m
      ),
    fit: /fit|waist|size|w31|length/.test(m),
    brand: /apc|a\.p\.c|nudie|edwin|levi|weekday/.test(m),
    open: /negotiate|offer|what can you|pair.?&?.?perk|deal for me|help/.test(m),
  };
}

function parseTargetPrice(msg: string, list: number): number | null {
  const off = msg.match(
    /(?:knock|take|cut|drop)\s*£?\s*(\d{1,3})\s*off|\b(\d{1,3})\s*off\b/i
  );
  if (off) {
    const discount = Number(off[1] || off[2]);
    const next = list - discount;
    if (discount > 0 && next >= 10 && next < list) return next;
  }
  const m = msg.match(/£\s*(\d{2,3})(?!\s*off)|\b(\d{2,3})\s*(?:quid|pounds?)\b/);
  if (!m) return null;
  const n = Number(m[1] || m[2]);
  if (n >= 10 && n < list) return n;
  return null;
}

export function runNegotiate(req: NegotiateRequest): NegotiateResponse {
  const shopper = getShopper();
  const primary = getProduct(req.productId);
  if (!primary) {
    return {
      steps: ["I can't find that pair. Pick another from the catalogue."],
      deal: {
        primaryId: req.productId,
        perkId: null,
        listPrice: 0,
        negotiatedPrice: 0,
        perkLabel: null,
        summary: "No product",
        concessions: [],
      },
      quickReplies: [],
      canApply: false,
    };
  }

  const history = req.history ?? [];
  const isFirst = history.filter((h) => h.role === "user").length === 0 && !req.message.trim();
  let deal =
    req.deal ??
    baseDeal(primary, pickPerk(primary));

  if (isFirst || (!req.message.trim() && history.length === 0)) {
    const past = shopper.pastPurchases[0];
    const brandFit = shopper.preferredBrands.some((b) =>
      primary.brand.toLowerCase().includes(b.toLowerCase().replace("jeans", "").trim()) ||
      b.toLowerCase().includes(primary.brand.toLowerCase())
    );
    const waistDelta = Math.abs(primary.waist - shopper.waist);
    const overBudget = primary.price - shopper.budgetMax;
    const steps = [
      waistDelta === 0
        ? `You usually wear W${shopper.waist}. This ${primary.brand} is the same waist${brandFit ? ", and it's a brand you already buy" : ""}.`
        : `You usually wear W${shopper.waist}. This ${primary.brand} is W${primary.waist}. A free perk can soften that risk.`,
      overBudget > 0
        ? `${gbp(primary.price)} is ${gbp(overBudget)} over your ${gbp(shopper.budgetMax)} ceiling.`
        : past
          ? `Last time you bought ${past.brand} ${past.name}. ${shopper.lastSeenNote}`
          : shopper.lastSeenNote,
    ];
    return {
      steps,
      deal,
      quickReplies: [
        overBudget > 0 ? "Knock £10 off" : "Too pricey, knock £10 off",
        "Better free perk?",
        "Lock Pair & Perk",
      ],
      canApply: Boolean(deal.perkId),
    };
  }

  const msg = req.message.trim();
  const i = intent(msg);
  const steps: string[] = [];
  let quickReplies = ["Too pricey", "Better perk", "Accept deal to checkout"];
  let canApply = Boolean(deal.perkId);

  if (i.accept) {
    steps.push(
      `Locked. ${deal.summary}.`,
      deal.concessions.length
        ? `Concessions on record: ${deal.concessions.join("; ")}.`
        : `Straight Pair & Perk. No further discounts.`,
      `I'll apply this into checkout with your saved profile (${shopper.name}, ${shopper.city}).`
    );
    canApply = true;
    quickReplies = ["Apply deal to checkout"];
    return { steps, deal, quickReplies, canApply };
  }

  if (i.tooPricey) {
    const asked = parseTargetPrice(msg, primary.price);
    const floor = Math.max(
      Math.round(primary.price * 0.85),
      primary.price - 15,
      Math.min(shopper.budgetMax, primary.price) - 5
    );
    let next = asked ?? Math.min(shopper.budgetMax, primary.price - 8);
    if (next < floor) {
      steps.push(
        `I can't go to ${gbp(next)}. Floor for this ${primary.condition} ${primary.brand} is around ${gbp(floor)}.`
      );
      next = floor;
      const perk = pickPerk(primary) ?? getProduct(deal.perkId ?? "");
      const alt = getPerkOptions(primary.id).find((p) => p.id !== deal.perkId);
      if (alt && (!perk || alt.price > (perk?.price ?? 0))) {
        deal = {
          ...deal,
          perkId: alt.id,
          perkLabel: `${alt.brand} ${alt.name} (free)`,
          negotiatedPrice: next,
          concessions: [
            ...deal.concessions,
            `price to ${gbp(next)}`,
            `perk upgraded to ${alt.brand}`,
          ],
          summary: `Negotiated Pair & Perk: ${primary.brand} at ${gbp(next)} (was ${gbp(primary.price)}) + free ${alt.brand}`,
        };
        steps.push(
          `Counter: ${gbp(next)} on the ${primary.brand}, and I'll upgrade your free perk to ${alt.brand} ${alt.name}.`
        );
      } else {
        deal = {
          ...deal,
          negotiatedPrice: next,
          concessions: [...deal.concessions, `price to ${gbp(next)}`],
          summary: `Negotiated: ${primary.brand} at ${gbp(next)} (was ${gbp(primary.price)})${deal.perkLabel ? ` + ${deal.perkLabel}` : ""}`,
        };
        steps.push(`Best I can do: ${gbp(next)} with your current perk.`);
      }
    } else {
      const mid = Math.round((primary.price + next) / 2);
      const offer = Math.max(floor, Math.min(next + 3, mid));
      const finalPrice = asked && asked >= floor ? asked : offer;
      deal = {
        ...deal,
        negotiatedPrice: finalPrice,
        concessions: [...deal.concessions, `price ${gbp(primary.price)} to ${gbp(finalPrice)}`],
        summary: `Negotiated Pair & Perk: ${primary.brand} at ${gbp(finalPrice)} (was ${gbp(primary.price)})${deal.perkLabel ? ` + ${deal.perkLabel}` : ""}`,
      };
      const perkName = deal.perkLabel?.replace(" (free)", "");
      const insideBudget =
        primary.price > shopper.budgetMax && finalPrice <= shopper.budgetMax;
      steps.push(
        insideBudget
          ? `${gbp(finalPrice)} lands inside your ${gbp(shopper.budgetMax)} ceiling. You were ${gbp(primary.price - shopper.budgetMax)} over at ${gbp(primary.price)}.`
          : `Counter-offer: ${gbp(finalPrice)} for the ${primary.brand}${perkName ? `, still including free ${perkName}` : ""}.`
      );
      if (perkName && insideBudget) {
        steps.push(`Free ${perkName} stays on the deal.`);
      }
    }
    if (Math.abs(primary.waist - shopper.waist) === 0) {
      steps.push("Accept, or push on the perk?");
    } else {
      steps.push(
        `This is still W${primary.waist} against your usual W${shopper.waist}. Accept, or swap the perk?`
      );
    }
    canApply = true;
    quickReplies = ["Accept deal to checkout", "Better perk instead", "One more pound off"];
    return { steps, deal, quickReplies, canApply };
  }

  if (i.betterPerk) {
    const current = deal.perkId ? getProduct(deal.perkId) : null;
    const opts = getPerkOptions(primary.id).filter((p) => p.id !== deal.perkId);
    const better = [...opts].sort((a, b) => b.price - a.price)[0];
    if (!better) {
      steps.push(
        current
          ? `You're already on the best perk match for W~${shopper.waist}: ${current.brand} ${current.name}.`
          : `No perk pool left for this waist. I can still discount the primary.`
      );
      quickReplies = ["Knock £8 off instead", "Accept deal to checkout"];
      return { steps, deal, quickReplies, canApply: true };
    }
    deal = {
      ...deal,
      perkId: better.id,
      perkLabel: `${better.brand} ${better.name} (free)`,
      concessions: [
        ...deal.concessions,
        `perk to ${better.brand} ${better.name} (was ${current ? current.brand : "none"})`,
      ],
      summary: `Negotiated Pair & Perk: ${primary.brand} at ${gbp(deal.negotiatedPrice)} + free ${better.brand}`,
    };
    steps.push(
      `Swapping perk. You liked organic and everyday pieces before. ${better.brand} ${better.name} is ${better.condition}, W${better.waist}, normally ${gbp(better.price)}.`,
      `New deal: pay ${gbp(deal.negotiatedPrice)} and get ${better.brand} free.`
    );
    canApply = true;
    quickReplies = ["Accept deal to checkout", "Still too much", "Tell me about fit"];
    return { steps, deal, quickReplies, canApply };
  }

  if (i.condition || i.fit) {
    const waistDelta = Math.abs(primary.waist - shopper.waist);
    steps.push(
      `Fit desk pull from your history: you wear W${shopper.waist} L${shopper.length}; this is W${primary.waist} L${primary.length} (${waistDelta === 0 ? "exact waist" : `Δ${waistDelta}`}).`,
      `Condition ${primary.condition} vs your floor ${shopper.minCondition}. ${primary.condition === "Fair" ? "Below your bar. I'd want a bigger perk or a price cut." : "Clears your bar."}`,
      primary.condition === "Fair" || primary.condition === "Good"
        ? `Keep the price and upgrade the perk, or take ${gbp(Math.max(primary.price - 10, shopper.budgetMax - 5))} with the current perk.`
        : `Wear note: ${primary.description.slice(0, 120)}`
    );
    if (primary.condition === "Fair" || primary.condition === "Good") {
      const discounted = Math.max(primary.price - 10, Math.min(shopper.budgetMax, primary.price - 5));
      deal = {
        ...deal,
        negotiatedPrice: discounted,
        concessions: [...deal.concessions, `condition trade-off to ${gbp(discounted)}`],
        summary: `Condition trade: ${primary.brand} at ${gbp(discounted)}${deal.perkLabel ? ` + ${deal.perkLabel}` : ""}`,
      };
    }
    canApply = true;
    quickReplies = ["Accept condition trade", "Better perk", "Too pricey"];
    return { steps, deal, quickReplies, canApply };
  }

  steps.push(
    `Using your profile (${shopper.preferredBrands.slice(0, 2).join(", ")}, W${shopper.waist}, budget ${gbp(shopper.budgetMax)}).`,
    deal.perkId
      ? `On the table: ${deal.summary}.`
      : `On the table: ${gbp(deal.negotiatedPrice)} for ${primary.brand}.`,
    `Push on price, swap the free perk, or ask about condition. Your call.`
  );
  canApply = Boolean(deal.perkId);
  quickReplies = [
    "Too pricey, knock £10 off",
    "Better free perk?",
    "Lock Pair & Perk",
  ];
  return { steps, deal, quickReplies, canApply };
}
