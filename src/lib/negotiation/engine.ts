import { getPerkOptions, getProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { EXTRA_CATALOG, TERM_CATALOG } from "./policies";
import type {
  BuyerTurn,
  Decision,
  ExtraId,
  Negotiation,
  Offer,
  PerkSummary,
  PricingContext,
  Term,
  TermId,
} from "./types";

/**
 * Deterministic deal engine, "enterprise buying" style: we sell deals, not
 * discounts. Every offer is a package — what the buyer gets (the pair, a free
 * Pair & Perk pair, free hemming) and what they commit to (terms such as final
 * sale or standard shipping). Price only moves in exchange for commitments,
 * starts at the merchant's target, and approaches the hidden walk-away price
 * in shrinking steps under sustained pressure, so a lowball never reveals it.
 * All levers come from the merchant's per-product policy (policies.ts); the
 * LLM only phrases these decisions.
 */

/** What giving away a perk pair costs us, as a share of its list price (slow stock) */
const PERK_COST_RATIO = 0.4;
/** After this many pushes below our position we're at the walk-away price */
const MAX_PRESSURE = 4;

export class NegotiationError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function requireProduct(productId: string): Product {
  const product = getProduct(productId);
  if (!product) {
    throw new NegotiationError(404, `Unknown productId "${productId}"`);
  }
  return product;
}

// ---------- policy views ----------

/** Buyer commitments this merchant trades for, with what each is worth to us */
export function availableTerms({ policy }: PricingContext): Term[] {
  if (!policy.negotiable) return [];
  return TERM_CATALOG.filter((t) => policy.terms[t.id]?.enabled && policy.terms[t.id].discount > 0).map(
    (t) => ({ id: t.id, label: t.label, discount: policy.terms[t.id].discount })
  );
}

export function termLabels(ids: TermId[]): string[] {
  return ids.map((id) => TERM_CATALOG.find((t) => t.id === id)?.label ?? id);
}

export function extraLabels(ids: ExtraId[]): string[] {
  return ids.map((id) => EXTRA_CATALOG.find((e) => e.id === id)?.label ?? id);
}

/** Value-adds we can include in a deal (none on high-value items) */
export function availableExtras({ policy }: PricingContext): ExtraId[] {
  if (policy.highValue) return [];
  return EXTRA_CATALOG.filter((e) => policy.extras[e.id]?.enabled).map((e) => e.id);
}

/** Free pairs the merchant allows with this product */
export function perkOptions({ product, policy }: PricingContext): Product[] {
  if (!policy.perkEnabled || policy.highValue) return [];
  const eligible = getPerkOptions(product.id);
  return policy.perkIds ? eligible.filter((p) => policy.perkIds!.includes(p.id)) : eligible;
}

/** Buyer's choice if allowed, else the pair we most want to move (then the most valuable) */
function pickPerk(ctx: PricingContext, perkId?: string): Product | null {
  const options = perkOptions(ctx);
  if (perkId) {
    const chosen = options.find((p) => p.id === perkId);
    if (!chosen) {
      throw new NegotiationError(
        400,
        `perkId "${perkId}" is not available with this product. Available perkIds: ${
          options.map((p) => p.id).join(", ") || "none"
        }`
      );
    }
    return chosen;
  }
  const pushed = new Set(ctx.policy.pushPerkIds);
  return (
    [...options].sort(
      (a, b) => Number(pushed.has(b.id)) - Number(pushed.has(a.id)) || b.price - a.price
    )[0] ?? null
  );
}

function perkCost(perk: Product): number {
  return Math.ceil(perk.price * PERK_COST_RATIO);
}

function extrasCost({ policy }: PricingContext, extras: ExtraId[]): number {
  return extras.reduce((s, id) => s + (policy.extras[id]?.cost ?? 0), 0);
}

function summarizePerk(perk: Product): PerkSummary {
  return { productId: perk.id, brand: perk.brand, name: perk.name, listPrice: perk.price };
}

// ---------- pricing ----------

/**
 * The lowest price we'd take right now. Starts at the target (a bit lower for
 * items we want to clear) and halves the distance to the walk-away price each
 * time the buyer pushes past it. "Hold" items never go below target.
 */
export function positionAt({ product, policy }: PricingContext, pressure: number): number {
  if (!policy.negotiable) return product.price;
  const floor = policy.priority === "hold" ? policy.targetPrice : policy.floorPrice;
  const start =
    policy.priority === "clear"
      ? Math.round(policy.targetPrice - (policy.targetPrice - floor) * 0.4)
      : policy.targetPrice;
  if (pressure >= MAX_PRESSURE) return floor;
  return Math.max(floor, Math.ceil(floor + (start - floor) * 0.5 ** pressure));
}

/** Price for a package: list minus what the terms are worth, never below our position */
function priceFor(
  ctx: PricingContext,
  terms: TermId[],
  perk: Product | null,
  extras: ExtraId[],
  pressure: number
): number {
  const all = availableTerms(ctx);
  const off = sortTerms(terms).reduce((s, id) => s + (all.find((t) => t.id === id)?.discount ?? 0), 0);
  const min = positionAt(ctx, pressure) + (perk ? perkCost(perk) : 0) + extrasCost(ctx, extras);
  return Math.min(ctx.product.price, Math.max(min, ctx.product.price - off));
}

function sortTerms(terms: TermId[]): TermId[] {
  const order = TERM_CATALOG.map((t) => t.id);
  // Store credit only applies to returns, so final sale (no returns) supersedes it
  const coherent = terms.includes("final_sale") ? terms.filter((t) => t !== "store_credit") : terms;
  return [...new Set(coherent)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function makeOffer(
  ctx: PricingContext,
  terms: TermId[],
  perk: Product | null,
  extras: ExtraId[],
  price: number
): Offer {
  const sorted = sortTerms(terms);
  return {
    offerId: [
      perk ? `perk-${perk.id}` : "cash",
      sorted.join("+") || "list",
      extras.join("+") || "noextras",
      String(price),
    ].join(":"),
    kind: perk ? "pair-and-perk" : "cash",
    price,
    perk: perk ? summarizePerk(perk) : null,
    terms: sorted,
    extras,
  };
}

/** What a deal is worth to the buyer on top of the pair: savings + free pair + extras */
export function dealValue(ctx: PricingContext, offer: Offer): number {
  const extras = (offer.extras ?? []).reduce((s, id) => s + (ctx.policy.extras[id]?.value ?? 0), 0);
  return Math.max(0, ctx.product.price - offer.price) + (offer.perk?.listPrice ?? 0) + extras;
}

/** Pushes on price before the free pair goes on the table, and before extras join it */
const PERK_AFTER_PRESSURE = 1;
const EXTRAS_AFTER_PRESSURE = 3;

/**
 * Standing deals. We don't open with gifts: the pair starts at list on its own.
 * Once the buyer has pushed on price, the Pair & Perk bundle (full price, free
 * pair) appears as the alternative to a discount; value-adds only join it
 * under sustained pressure. `askedForPerk` puts the bundle up when requested.
 */
function standingOffers(
  ctx: PricingContext,
  perk: Product | null,
  pressure: number,
  askedForPerk = false
): Offer[] {
  const extras = pressure >= EXTRAS_AFTER_PRESSURE ? availableExtras(ctx) : [];
  const offers = [makeOffer(ctx, [], null, [], ctx.product.price)];
  if (perk && (askedForPerk || pressure >= PERK_AFTER_PRESSURE)) {
    offers.push(makeOffer(ctx, [], perk, extras, ctx.product.price));
  } else if (!perk && extras.length) {
    offers.push(makeOffer(ctx, [], null, extras, ctx.product.price));
  }
  return offers;
}

function tableWith(
  ctx: PricingContext,
  perk: Product | null,
  pressure: number,
  extra: Offer[] = [],
  askedForPerk = false
): Offer[] {
  const seen = new Set<string>();
  return [...extra, ...standingOffers(ctx, perk, pressure, askedForPerk)].filter(
    (o) => !seen.has(o.offerId) && seen.add(o.offerId)
  );
}

function subsetsOf(ids: TermId[]): TermId[][] {
  const subsets: TermId[][] = [];
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    subsets.push(ids.filter((_, i) => mask & (1 << i)));
  }
  return subsets;
}

/** All subsets of the available terms */
function termSubsets(ctx: PricingContext): TermId[][] {
  return subsetsOf(availableTerms(ctx).map((t) => t.id));
}

/**
 * The least the buyer needs to commit to (beyond what they already offered)
 * for a package to reach `price`: fewest extra terms, then the ones worth
 * least to us, so we give away as little as possible.
 */
function termsToReach(
  ctx: PricingContext,
  buyerTerms: TermId[],
  price: number,
  perk: Product | null,
  extras: ExtraId[],
  pressure: number
): TermId[] | null {
  return (
    termSubsets(ctx)
      .map((extra) => sortTerms([...buyerTerms, ...extra]))
      .filter((terms) => priceFor(ctx, terms, perk, extras, pressure) <= price)
      .sort(
        (a, b) =>
          a.length - b.length ||
          priceFor(ctx, b, perk, extras, pressure) - priceFor(ctx, a, perk, extras, pressure)
      )[0] ?? null
  );
}

/** What a policy means in practice (merchant dashboard) */
export function policySummary(ctx: PricingContext) {
  const allTerms = availableTerms(ctx).map((t) => t.id);
  const perk = pickPerk(ctx);
  const extras = availableExtras(ctx);
  return {
    listPrice: ctx.product.price,
    firstPosition: positionAt(ctx, 0),
    walkAway: positionAt(ctx, MAX_PRESSURE),
    concessionPath: Array.from({ length: MAX_PRESSURE + 1 }, (_, i) => positionAt(ctx, i)),
    bestPriceWithAllTerms: priceFor(ctx, allTerms, null, [], MAX_PRESSURE),
    bundle: perk
      ? {
          perk: summarizePerk(perk),
          extras,
          price: priceFor(ctx, [], perk, extras, 0),
          dealValue: dealValue(ctx, makeOffer(ctx, [], perk, extras, ctx.product.price)),
        }
      : null,
  };
}

// ---------- turns ----------

export function openingTerms(
  ctx: PricingContext,
  perkId?: string
): Pick<Negotiation, "round" | "offers" | "pressure"> {
  return { round: 0, pressure: 0, offers: standingOffers(ctx, pickPerk(ctx, perkId), 0, Boolean(perkId)) };
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
  const pressure = neg.pressure ?? 0;
  const allowedPerks = perkOptions(ctx).map((p) => p.id);
  const previousPerkId = neg.offers.find((o) => o.perk)?.perk?.productId;
  const currentPerkId =
    turn.perkId ?? (previousPerkId && allowedPerks.includes(previousPerkId) ? previousPerkId : undefined);
  const perk = pickPerk(ctx, currentPerkId);
  // Asking for a free pair the merchant hasn't allowed is just conversation, not an error
  const dealPerk = turn.includePerk ? perk : null;
  const dealExtras = turn.includePerk ? availableExtras(ctx) : [];
  const buyerTerms = sortTerms(turn.offerTerms ?? []);

  const base: Negotiation = {
    ...neg,
    pressure,
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
  // Keep the bundle up once it has been offered or asked for
  const perkShown = Boolean(turn.includePerk || turn.perkId || neg.offers.some((o) => o.perk));
  const onTable = (extra: Offer[], nextPressure = pressure): Negotiation => ({
    ...base,
    pressure: nextPressure,
    offers: tableWith(ctx, perk, nextPressure, extra, perkShown),
  });

  // 1. Buyer accepts one of the deals on the table
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

  // 2. Buyer names a price (maybe with their own terms)
  if (turn.counterOffer != null) {
    const counter = Math.round(turn.counterOffer * 100) / 100;

    // What they're offering already works: deal (never above list)
    if (counter >= priceFor(ctx, buyerTerms, dealPerk, dealExtras, pressure)) {
      const offer = makeOffer(ctx, buyerTerms, dealPerk, dealExtras, Math.min(counter, ctx.product.price));
      return { next: agree(offer), decision: { type: "accept_counter", offer } };
    }

    // Their price works if they commit to a little more
    const needed = termsToReach(ctx, buyerTerms, counter, dealPerk, dealExtras, pressure);
    if (needed) {
      const offer = makeOffer(ctx, needed, dealPerk, dealExtras, counter);
      return { next: onTable([offer]), decision: { type: "conditional", offer } };
    }

    // Too low: propose a deal instead of just a number. We only give ground when
    // the buyer does: a first counter, or one higher than their last, moves our
    // position one (shrinking) step; repeating or lowering it gets the same deal.
    const lastCounter = [...neg.transcript].reverse().find((t) => t.role === "buyer" && t.counterOffer != null)
      ?.counterOffer;
    const buyerMoved = lastCounter == null || counter > lastCounter;
    const nextPressure = buyerMoved ? Math.min(MAX_PRESSURE, pressure + 1) : pressure;
    const position = positionAt(ctx, nextPressure);
    const allTerms = availableTerms(ctx).map((t) => t.id);
    const cashTerms =
      termsToReach(ctx, buyerTerms, position, null, [], nextPressure) ??
      sortTerms([...buyerTerms, ...allTerms]);
    const cash = makeOffer(ctx, cashTerms, null, [], priceFor(ctx, cashTerms, null, [], nextPressure));
    // Answer a price with a price deal. The full-price bundle (free pair, never
    // also discounted) stands beside it as the alternative, not the lead.
    return {
      next: onTable([cash], nextPressure),
      decision: {
        type: "counter",
        offer: cash,
        final: position === positionAt(ctx, MAX_PRESSURE),
        held: !buyerMoved,
      },
    };
  }

  // 3. Buyer proposes terms without a price: quote the deal for them, keeping
  //    only the commitments that actually improve the price (no free lunch for us)
  if (buyerTerms.length > 0) {
    const best = priceFor(ctx, buyerTerms, dealPerk, dealExtras, pressure);
    const needed =
      subsetsOf(buyerTerms)
        .filter((t) => priceFor(ctx, t, dealPerk, dealExtras, pressure) === best)
        .sort((a, b) => a.length - b.length)[0] ?? buyerTerms;
    const offer = makeOffer(ctx, needed, dealPerk, dealExtras, best);
    return { next: onTable([offer]), decision: { type: "quote", offer } };
  }

  // 4. Buyer asks for the bundle without a price: it's the full-price deal
  if (turn.includePerk && dealPerk && neg.status === "open") {
    const offer = standingOffers(ctx, dealPerk, pressure, true).find((o) => o.perk)!;
    return { next: onTable([offer]), decision: { type: "quote", offer } };
  }

  // 5. Conversation only (a perk switch may still change the standing deals)
  return {
    next:
      neg.status === "open"
        ? onTable(neg.offers.filter((o) => o.terms.length && (!o.perk || o.perk.productId === perk?.id)))
        : base,
    decision: { type: "info" },
  };
}
