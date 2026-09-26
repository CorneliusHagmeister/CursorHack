import { getPerkOptions, getProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import type {
  BuyerTurn,
  Decision,
  Negotiation,
  Offer,
  PerkSummary,
} from "./types";

/**
 * Deterministic merchant pricing rules. Every number the buyer ever sees comes
 * from here — the LLM only phrases the decision.
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
/** After this many counters the merchant goes to best-and-final */
const MAX_ROUNDS = 4;
/** Counters below this share of the floor are treated as lowballs */
const LOWBALL_RATIO = 0.7;
const CONCESSION_SHARE = 0.45;
const LOWBALL_CONCESSION_SHARE = 0.15;

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

function bundlePrice(listPrice: number, ask: number, perk: Product): number {
  return Math.min(listPrice, ask + perkCost(perk));
}

function buildOffers(
  round: number,
  listPrice: number,
  ask: number,
  perk: Product | null
): Offer[] {
  const offers: Offer[] = [
    { offerId: `r${round}-cash`, kind: "cash", price: ask, perk: null },
  ];
  if (perk) {
    offers.push({
      offerId: `r${round}-perk-${perk.id}`,
      kind: "pair-and-perk",
      price: bundlePrice(listPrice, ask, perk),
      perk: summarizePerk(perk),
    });
  }
  return offers;
}

export function requireProduct(productId: string): Product {
  const product = getProduct(productId);
  if (!product) {
    throw new NegotiationError(404, `Unknown productId "${productId}"`);
  }
  return product;
}

/** Opening position: list price, plus the classic Pair & Perk bundle at list */
export function openingTerms(
  product: Product,
  perkId?: string
): Pick<Negotiation, "merchantAsk" | "round" | "finalOfferMade" | "offers"> {
  const perk = pickPerk(product.id, perkId);
  return {
    merchantAsk: product.price,
    round: 0,
    finalOfferMade: false,
    offers: buildOffers(0, product.price, product.price, perk),
  };
}

export function applyBuyerTurn(
  neg: Negotiation,
  turn: BuyerTurn
): { next: Negotiation; decision: Decision } {
  if (neg.status === "purchased") {
    throw new NegotiationError(409, "This negotiation already ended in a purchase.");
  }
  const priceAction = turn.counterOffer != null || turn.acceptOfferId != null;
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

  const base: Negotiation = {
    ...neg,
    updatedAt: now,
    transcript: [
      ...neg.transcript,
      { role: "buyer", text: turn.message, counterOffer: turn.counterOffer, at: now },
    ],
  };

  const agree = (offer: Offer): Negotiation => ({
    ...base,
    status: "agreed",
    offers: [offer],
    agreed: { ...offer, agreedAt: now },
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

  // 2. No price action — conversation only (perk choice may still change the offers)
  if (turn.counterOffer == null) {
    const offers =
      neg.status === "open"
        ? buildOffers(neg.round, product.price, neg.merchantAsk, perk)
        : neg.offers;
    return { next: { ...base, offers }, decision: { type: "info" } };
  }

  // 3. Buyer counter-offer, evaluated in cash-equivalent terms
  const counter = Math.round(turn.counterOffer * 100) / 100;
  if (turn.includePerk && !perk) {
    throw new NegotiationError(400, "No Pair & Perk options exist for this product.");
  }
  const withPerk = turn.includePerk && perk ? perk : null;
  const cashEquivalent = withPerk ? counter - perkCost(withPerk) : counter;
  const floor = floorPrice(product);
  const ask = neg.merchantAsk;

  if (cashEquivalent >= ask) {
    // Buyer met or beat our ask — close at our ask, never above it
    const offer: Offer = {
      offerId: `r${neg.round}-deal`,
      kind: withPerk ? "pair-and-perk" : "cash",
      price: withPerk ? bundlePrice(product.price, ask, withPerk) : ask,
      perk: withPerk ? summarizePerk(withPerk) : null,
    };
    return { next: agree(offer), decision: { type: "accept_counter", offer } };
  }

  if (neg.finalOfferMade) {
    return {
      next: { ...base, offers: buildOffers(neg.round, product.price, ask, perk) },
      decision: { type: "hold" },
    };
  }

  const round = neg.round + 1;
  const lowball = cashEquivalent < floor * LOWBALL_RATIO;
  const gap = ask - floor;
  let nextAsk = Math.max(
    floor,
    Math.floor(ask - gap * (lowball ? LOWBALL_CONCESSION_SHARE : CONCESSION_SHARE))
  );
  if (gap > 0 && nextAsk === ask) nextAsk = ask - 1;
  if (round >= MAX_ROUNDS) nextAsk = floor;

  if (cashEquivalent >= nextAsk) {
    // Their number is at least what we'd have countered with — take it
    const offer: Offer = {
      offerId: `r${round}-deal`,
      kind: withPerk ? "pair-and-perk" : "cash",
      price: counter,
      perk: withPerk ? summarizePerk(withPerk) : null,
    };
    return { next: agree(offer), decision: { type: "accept_counter", offer } };
  }

  const final = nextAsk === floor;
  return {
    next: {
      ...base,
      round,
      merchantAsk: nextAsk,
      finalOfferMade: final,
      offers: buildOffers(round, product.price, nextAsk, perk),
    },
    decision: final ? { type: "final" } : { type: "counter", lowball },
  };
}
