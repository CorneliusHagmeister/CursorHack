import { getPerkOptions, getProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { TERM_CATALOG } from "./policies";
import type {
  BuyerTurn,
  Decision,
  Negotiation,
  Offer,
  PerkSummary,
  PricingContext,
  Term,
  TermId,
} from "./types";

/**
 * Deterministic merchant pricing, "enterprise style": the price never drops
 * for nothing. Every reduction is traded for a buyer commitment (a term), and
 * the merchant's floor caps the total. Pair & Perk adds value (a free pair)
 * instead of cutting price. All levers come from the merchant's per-product
 * policy (policies.ts); the LLM only phrases these decisions.
 */
/** What giving away a perk pair "costs" the merchant — it's slow-moving stock */
const PERK_COST_RATIO = 0.4;

export class NegotiationError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** Terms this merchant currently trades for, with their GBP value */
export function availableTerms({ policy }: PricingContext): Term[] {
  if (!policy.negotiable) return [];
  return TERM_CATALOG.filter((t) => policy.terms[t.id]?.enabled && policy.terms[t.id].discount > 0).map(
    (t) => ({ id: t.id, label: t.label, discount: policy.terms[t.id].discount })
  );
}

export function termLabels(ids: TermId[]): string[] {
  return ids.map((id) => TERM_CATALOG.find((t) => t.id === id)?.label ?? id);
}

function perkCost(perk: Product): number {
  return Math.ceil(perk.price * PERK_COST_RATIO);
}

function summarizePerk(perk: Product): PerkSummary {
  return {
    productId: perk.id,
    brand: perk.brand,
    name: perk.name,
    listPrice: perk.price,
  };
}

/** Free pairs the merchant allows with this product */
export function perkOptions({ product, policy }: PricingContext): Product[] {
  if (!policy.perkEnabled) return [];
  const eligible = getPerkOptions(product.id);
  return policy.perkIds ? eligible.filter((p) => policy.perkIds!.includes(p.id)) : eligible;
}

/** Buyer-chosen perk if given (must be allowed), else the most valuable allowed one */
function pickPerk(ctx: PricingContext, perkId?: string): Product | null {
  const options = perkOptions(ctx);
  if (perkId) {
    const chosen = options.find((p) => p.id === perkId);
    if (!chosen) {
      throw new NegotiationError(
        400,
        `perkId "${perkId}" is not eligible for this product. Eligible perkIds: ${
          options.map((p) => p.id).join(", ") || "none"
        }`
      );
    }
    return chosen;
  }
  return [...options].sort((a, b) => b.price - a.price)[0] ?? null;
}

/** Lowest price the merchant accepts for a set of terms (with or without the free perk) */
function priceFor(ctx: PricingContext, terms: TermId[], perk: Product | null): number {
  const { product, policy } = ctx;
  const all = availableTerms(ctx);
  const off = terms.reduce((s, id) => s + (all.find((t) => t.id === id)?.discount ?? 0), 0);
  const floor = policy.floorPrice + (perk ? perkCost(perk) : 0);
  // Never above list: Pair & Perk at list is the baseline bundle
  return Math.min(product.price, Math.max(floor, product.price - off));
}

function sortTerms(terms: TermId[]): TermId[] {
  const order = TERM_CATALOG.map((t) => t.id);
  return [...new Set(terms)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function makeOffer(
  ctx: PricingContext,
  terms: TermId[],
  perk: Product | null,
  price = priceFor(ctx, terms, perk)
): Offer {
  const sorted = sortTerms(terms);
  return {
    offerId: [perk ? `perk-${perk.id}` : "cash", sorted.join("+") || "list", String(price)].join(":"),
    kind: perk ? "pair-and-perk" : "cash",
    price,
    perk: perk ? summarizePerk(perk) : null,
    terms: sorted,
  };
}

/** Standing offers (list price, bundle at list) plus any conditional ones */
function tableWith(ctx: PricingContext, perk: Product | null, extra: Offer[] = []): Offer[] {
  const base = [makeOffer(ctx, [], null), ...(perk ? [makeOffer(ctx, [], perk)] : [])];
  const seen = new Set<string>();
  return [...extra, ...base].filter((o) => !seen.has(o.offerId) && seen.add(o.offerId));
}

/** All subsets of the available terms, fewest first */
function termSubsets(ctx: PricingContext): TermId[][] {
  const ids = availableTerms(ctx).map((t) => t.id);
  const subsets: TermId[][] = [];
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    subsets.push(ids.filter((_, i) => mask & (1 << i)));
  }
  return subsets.sort((a, b) => a.length - b.length);
}

export function requireProduct(productId: string): Product {
  const product = getProduct(productId);
  if (!product) {
    throw new NegotiationError(404, `Unknown productId "${productId}"`);
  }
  return product;
}

/** What a policy means in practice: the best prices a buyer can reach */
export function policySummary(ctx: PricingContext) {
  const allTerms = availableTerms(ctx).map((t) => t.id);
  const perk = pickPerk(ctx);
  return {
    listPrice: ctx.product.price,
    bestCashPrice: priceFor(ctx, allTerms, null),
    bundle: perk
      ? {
          perk: summarizePerk(perk),
          price: priceFor(ctx, [], perk),
          bestPrice: priceFor(ctx, allTerms, perk),
        }
      : null,
  };
}

export function openingTerms(
  ctx: PricingContext,
  perkId?: string
): Pick<Negotiation, "round" | "offers"> {
  return { round: 0, offers: tableWith(ctx, pickPerk(ctx, perkId)) };
}

export function applyBuyerTurn(
  neg: Negotiation,
  turn: BuyerTurn,
  ctx: PricingContext
): { next: Negotiation; decision: Decision } {
  if (neg.status === "purchased") {
    throw new NegotiationError(409, "This negotiation already ended in a purchase.");
  }
  const priceAction =
    turn.counterOffer != null || turn.acceptOfferId != null || (turn.offerTerms?.length ?? 0) > 0;
  if (neg.status === "agreed" && priceAction) {
    throw new NegotiationError(
      409,
      `A deal is already agreed at £${neg.agreed?.price}. Call the purchase endpoint to buy.`
    );
  }

  const now = new Date().toISOString();
  const allowedPerks = perkOptions(ctx).map((p) => p.id);
  const previousPerkId = neg.offers.find((o) => o.perk)?.perk?.productId;
  // Keep the earlier perk only if the merchant still allows it
  const currentPerkId =
    turn.perkId ?? (previousPerkId && allowedPerks.includes(previousPerkId) ? previousPerkId : undefined);
  const perk = pickPerk(ctx, currentPerkId);
  if (turn.includePerk && !perk) {
    throw new NegotiationError(400, "No Pair & Perk options exist for this product.");
  }
  const dealPerk = turn.includePerk ? perk : null;
  const buyerTerms = sortTerms(turn.offerTerms ?? []);

  const base: Negotiation = {
    ...neg,
    updatedAt: now,
    round: priceAction && !turn.acceptOfferId ? neg.round + 1 : neg.round,
    transcript: [
      ...neg.transcript,
      {
        role: "buyer",
        text: turn.message,
        counterOffer: turn.counterOffer,
        offerTerms: buyerTerms.length ? buyerTerms : undefined,
        at: now,
      },
    ],
  };
  const agree = (offer: Offer): Negotiation => ({
    ...base,
    status: "agreed",
    offers: [offer],
    agreed: { ...offer, agreedAt: now },
  });
  const onTable = (extra: Offer[]): Negotiation => ({
    ...base,
    offers: tableWith(ctx, perk, extra),
  });

  // 1. Buyer accepts one of our standing offers
  if (turn.acceptOfferId != null) {
    const offer = neg.offers.find((o) => o.offerId === turn.acceptOfferId);
    if (!offer) {
      throw new NegotiationError(
        400,
        `Offer "${turn.acceptOfferId}" is not on the table. Current offerIds: ${neg.offers
          .map((o) => o.offerId)
          .join(", ")}`
      );
    }
    return { next: agree(offer), decision: { type: "accept_offer", offer } };
  }

  // 2. Buyer names a price — maybe with terms of their own
  if (turn.counterOffer != null) {
    const counter = Math.round(turn.counterOffer * 100) / 100;

    // Their own terms already justify their price: deal
    if (counter >= priceFor(ctx, buyerTerms, dealPerk)) {
      // Never charge more than list, even if they offered more
      const offer = makeOffer(ctx, buyerTerms, dealPerk, Math.min(counter, ctx.product.price));
      return { next: agree(offer), decision: { type: "accept_counter", offer } };
    }

    // Ask for as little as possible in return: fewest extra terms, then the
    // combination that gives away the least while still meeting their price
    const needed = termSubsets(ctx)
      .map((extra) => sortTerms([...buyerTerms, ...extra]))
      .filter((terms) => counter >= priceFor(ctx, terms, dealPerk))
      .sort(
        (a, b) =>
          a.length - b.length ||
          priceFor(ctx, b, dealPerk) - priceFor(ctx, a, dealPerk)
      )[0];
    if (needed) {
      const offer = makeOffer(ctx, needed, dealPerk, counter);
      return { next: onTable([offer]), decision: { type: "conditional", offer } };
    }

    // Too low even with every term — show the best we can do
    const best = makeOffer(
      ctx,
      availableTerms(ctx).map((t) => t.id),
      dealPerk
    );
    return { next: onTable([best]), decision: { type: "hold", best } };
  }

  // 3. Buyer proposes terms without a price — quote them
  if (buyerTerms.length > 0) {
    const offer = makeOffer(ctx, buyerTerms, dealPerk);
    return { next: onTable([offer]), decision: { type: "quote", offer } };
  }

  // 4. Conversation only (a perk switch may still change the standing offers)
  return {
    next: neg.status === "open" ? onTable(neg.offers.filter((o) => o.terms.length && (!o.perk || o.perk.productId === perk?.id))) : base,
    decision: { type: "info" },
  };
}
