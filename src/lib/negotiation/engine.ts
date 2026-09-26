import { getPerkOptions, getProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import type {
  BuyerTurn,
  Decision,
  Negotiation,
  Offer,
  PerkSummary,
  Term,
  TermId,
} from "./types";

/**
 * Deterministic merchant pricing rules, "enterprise style": the price never
 * drops for nothing. Every reduction is traded for a buyer commitment (a
 * term), and the hidden floor caps the total. Pair & Perk adds value (a free
 * pair) instead of cutting price. The LLM only phrases these decisions.
 */
const DEFAULT_MAX_DISCOUNT = 0.2;
const MAX_DISCOUNT: Record<string, number> = {
  "apc-petit-new": 0.15, // hero pair, holds value
  "nudie-lean-dean": 0.18,
  "wrangler-texas": 0.25,
  "levi-550-relaxed": 0.3, // been on the rail a while
};
/** What giving away a perk pair "costs" the merchant — it's slow-moving stock */
const PERK_COST_RATIO = 0.4;

/** The give-gets on offer. Discounts are a share of list, or flat GBP. */
const TERM_RULES: { id: TermId; label: string; share?: number; flat?: number }[] = [
  { id: "final_sale", label: "Final sale — no returns", share: 0.08 },
  { id: "standard_shipping", label: "Standard 5-day shipping instead of next-day", flat: 4 },
  { id: "fit_review", label: "Post a fit review with photos within 14 days", share: 0.06 },
];

export const TERM_IDS: TermId[] = TERM_RULES.map((r) => r.id);

export class NegotiationError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function floorPrice(product: Product): number {
  const discount = MAX_DISCOUNT[product.id] ?? DEFAULT_MAX_DISCOUNT;
  return Math.ceil(product.price * (1 - discount));
}

export function availableTerms(product: Product): Term[] {
  return TERM_RULES.map((r) => ({
    id: r.id,
    label: r.label,
    discount: Math.max(1, r.flat ?? Math.round(product.price * (r.share ?? 0))),
  }));
}

export function termLabels(product: Product, ids: TermId[]): string[] {
  const terms = availableTerms(product);
  return ids.map((id) => terms.find((t) => t.id === id)?.label ?? id);
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

/** Buyer-chosen perk if given (must be eligible), else the most valuable eligible one */
function pickPerk(productId: string, perkId?: string): Product | null {
  const options = getPerkOptions(productId);
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
function priceFor(product: Product, terms: TermId[], perk: Product | null): number {
  const all = availableTerms(product);
  const off = terms.reduce((s, id) => s + (all.find((t) => t.id === id)?.discount ?? 0), 0);
  const floor = floorPrice(product) + (perk ? perkCost(perk) : 0);
  return Math.max(floor, product.price - off);
}

function sortTerms(terms: TermId[]): TermId[] {
  const order = TERM_RULES.map((r) => r.id);
  return [...new Set(terms)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function makeOffer(
  product: Product,
  terms: TermId[],
  perk: Product | null,
  price = priceFor(product, terms, perk)
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
function tableWith(product: Product, perk: Product | null, extra: Offer[] = []): Offer[] {
  const base = [makeOffer(product, [], null), ...(perk ? [makeOffer(product, [], perk)] : [])];
  const seen = new Set<string>();
  return [...extra, ...base].filter((o) => !seen.has(o.offerId) && seen.add(o.offerId));
}

/** All subsets of the available terms, fewest first */
function termSubsets(product: Product): TermId[][] {
  const ids = availableTerms(product).map((t) => t.id);
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

export function openingTerms(
  product: Product,
  perkId?: string
): Pick<Negotiation, "round" | "offers"> {
  return { round: 0, offers: tableWith(product, pickPerk(product.id, perkId)) };
}

export function applyBuyerTurn(
  neg: Negotiation,
  turn: BuyerTurn
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

  const product = requireProduct(neg.productId);
  const now = new Date().toISOString();
  const currentPerkId =
    turn.perkId ?? neg.offers.find((o) => o.perk)?.perk?.productId;
  const perk = pickPerk(product.id, currentPerkId);
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
    offers: tableWith(product, perk, extra),
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
    if (counter >= priceFor(product, buyerTerms, dealPerk)) {
      // Never charge more than list, even if they offered more
      const offer = makeOffer(product, buyerTerms, dealPerk, Math.min(counter, product.price));
      return { next: agree(offer), decision: { type: "accept_counter", offer } };
    }

    // Ask for as little as possible in return: fewest extra terms, then the
    // combination that gives away the least while still meeting their price
    const needed = termSubsets(product)
      .map((extra) => sortTerms([...buyerTerms, ...extra]))
      .filter((terms) => counter >= priceFor(product, terms, dealPerk))
      .sort(
        (a, b) =>
          a.length - b.length ||
          priceFor(product, b, dealPerk) - priceFor(product, a, dealPerk)
      )[0];
    if (needed) {
      const offer = makeOffer(product, needed, dealPerk, counter);
      return { next: onTable([offer]), decision: { type: "conditional", offer } };
    }

    // Too low even with every term — show the best we can do
    const best = makeOffer(
      product,
      availableTerms(product).map((t) => t.id),
      dealPerk
    );
    return { next: onTable([best]), decision: { type: "hold", best } };
  }

  // 3. Buyer proposes terms without a price — quote them
  if (buyerTerms.length > 0) {
    const offer = makeOffer(product, buyerTerms, dealPerk);
    return { next: onTable([offer]), decision: { type: "quote", offer } };
  }

  // 4. Conversation only (a perk switch may still change the standing offers)
  return {
    next: neg.status === "open" ? onTable(neg.offers.filter((o) => o.terms.length)) : base,
    decision: { type: "info" },
  };
}
