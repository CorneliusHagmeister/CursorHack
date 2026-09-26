import type { NegotiatedDeal, NegotiateResponse, ShopperProfile } from "@/lib/types";
import { NegotiationError, extraLabels, requireProduct, termLabels } from "./engine";
import { fetchNegotiation, purchaseDeal, sendMessage, startNegotiation } from "./service";
import type { BuyerTurn, Offer, TermId } from "./types";

/**
 * Adapter for the original connector shape ({ steps, deal, quickReplies,
 * canApply }) used by the MCP `negotiate` tool, /api/v1/negotiations and the
 * on-site deal desk (/api/negotiate). Everything runs on the deal engine in
 * service.ts; this file only translates. New fields are added alongside the
 * old ones, never instead of them, so existing connectors keep working.
 */

type PublicOffer = Offer & { dealValue?: number };
type View = {
  negotiationId: string;
  transcript?: { role: "buyer" | "merchant"; offer?: PublicOffer | null }[];
  status: "open" | "agreed" | "purchased";
  product: { id: string; listPrice: number };
  offers: PublicOffer[];
  agreedDeal: PublicOffer | null;
  merchantReply?: string;
  dealOffer?: PublicOffer | null;
};

export type CompatResponse = NegotiateResponse & {
  negotiationId: string;
  deal: NegotiatedDeal & { negotiationId: string; offerId: string | null };
  /** Full deal-engine state (offers, negotiables, guidance) for newer clients */
  negotiation: View;
};

/** The deal we'd point the buyer at: agreed, else the one just proposed, else the best value */
function leadOffer(view: View): PublicOffer | null {
  if (view.agreedDeal) return view.agreedDeal;
  const onTable = (o?: PublicOffer | null) => o && view.offers.find((x) => x.offerId === o.offerId);
  const proposed =
    onTable(view.dealOffer) ??
    onTable([...(view.transcript ?? [])].reverse().find((t) => t.role === "merchant" && t.offer)?.offer);
  if (proposed) return proposed;
  return (
    [...view.offers].sort(
      (a, b) => (b.dealValue ?? 0) - (a.dealValue ?? 0) || a.price - b.price
    )[0] ?? null
  );
}

function toLegacyDeal(view: View, offer: PublicOffer | null): CompatResponse["deal"] {
  const list = view.product.listPrice;
  const price = offer?.price ?? list;
  const perkLabel = offer?.perk ? `${offer.perk.brand} ${offer.perk.name} (free)` : null;
  const concessions = [
    ...termLabels(offer?.terms ?? []),
    ...extraLabels(offer?.extras ?? []),
  ];
  const summary = [
    `£${price}`,
    offer?.perk ? `+ ${offer.perk.brand} ${offer.perk.name} free` : null,
    offer?.extras?.length ? `+ ${extraLabels(offer.extras).join(" + ").toLowerCase()}` : null,
    offer?.terms.length ? `for ${termLabels(offer.terms).join(", ").toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    primaryId: view.product.id,
    perkId: offer?.perk?.productId ?? null,
    listPrice: list,
    negotiatedPrice: price,
    perkLabel,
    summary,
    concessions,
    negotiationId: view.negotiationId,
    offerId: offer?.offerId ?? null,
  };
}

/**
 * Split the merchant reply into up to three chat bubbles. Only breaks after
 * ., ! or ? followed by a space and a capital/£/quote — and never after a
 * single capital letter, so "A.P.C." and initials stay intact.
 */
function toSteps(reply: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  for (const m of reply.matchAll(/[.!?]+\s+(?=[A-Z£"'])/g)) {
    const end = m.index! + m[0].length;
    const before = reply.slice(start, m.index! + 1);
    if (/(^|[\s.])[A-Z]\.$/.test(before)) continue;
    sentences.push(reply.slice(start, end).trim());
    start = end;
  }
  if (start < reply.length) sentences.push(reply.slice(start).trim());
  const steps: string[] = [];
  for (const s of sentences.filter(Boolean)) {
    if (steps.length < 3) steps.push(s);
    else steps[2] += ` ${s}`;
  }
  return steps.length ? steps : [reply];
}

function quickRepliesFor(view: View): string[] {
  if (view.status !== "open") return ["Apply deal to checkout"];
  const replies = ["Knock £10 off", "We can do final sale", "We'll take the deal"];
  if (view.offers.some((o) => o.perk)) replies.splice(2, 0, "Include the free pair");
  return replies;
}

function respond(view: View, reply: string): CompatResponse {
  const offer = leadOffer(view);
  return {
    negotiationId: view.negotiationId,
    steps: toSteps(reply),
    deal: toLegacyDeal(view, offer),
    quickReplies: quickRepliesFor(view),
    canApply: view.status !== "purchased" && Boolean(offer),
    negotiation: view,
  };
}

const TERM_PATTERNS: [TermId, RegExp][] = [
  ["final_sale", /final sale|no returns?/i],
  ["store_credit", /store credit|shop credit|credit instead/i],
  ["standard_shipping", /standard (5-day )?shipping|slow(er)? shipping|no rush|5-day/i],
  ["fit_review", /review/i],
  ["collect_london", /collect|pick(ing)? (it |them )?up/i],
];

/**
 * Turn free text ("Knock £10 off", "£80 with final sale", "we'll take the
 * deal") into a structured turn. Structured fields in `extra` win.
 */
export function parseBuyerText(
  text: string,
  view: View,
  extra: Partial<BuyerTurn> = {}
): BuyerTurn {
  const t = text.toLowerCase();
  const offerTerms = TERM_PATTERNS.filter(([, re]) => re.test(t)).map(([id]) => id);
  const includePerk = /perk|bundle|free pair|extra pair|pair & perk|include the/i.test(t);

  let counterOffer: number | undefined;
  const off = t.match(/£?\s?(\d+(?:\.\d{1,2})?)\s?(?:quid|pounds?)?\s+off/);
  const amount = t.match(/£\s?(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s?(?:quid|pounds?)\b|\b(?:for|at|do|take|offer)\s+(\d{2,4})\b/);
  if (off) {
    const cash = view.offers.filter((o) => !o.perk).map((o) => o.price);
    const reference = cash.length ? Math.min(...cash) : view.product.listPrice;
    counterOffer = Math.max(1, reference - Number(off[1]));
  } else if (amount) {
    counterOffer = Number(amount[1] ?? amount[2] ?? amount[3]);
  }

  let acceptOfferId: string | undefined;
  const accepting = /\b(deal|we'?ll take|i'?ll take|accept|agreed|sounds good|yes please|apply)\b/i.test(t);
  if (accepting && counterOffer == null && offerTerms.length === 0) {
    const wanted = includePerk ? view.offers.find((o) => o.perk) : leadOffer(view);
    acceptOfferId = wanted?.offerId;
  }

  return {
    message: text,
    ...(counterOffer != null && !acceptOfferId ? { counterOffer } : {}),
    ...(offerTerms.length && !acceptOfferId ? { offerTerms } : {}),
    ...(includePerk && !acceptOfferId ? { includePerk } : {}),
    ...(acceptOfferId ? { acceptOfferId } : {}),
    ...extra,
  };
}

export async function compatStart(input: {
  productId: string;
  shopper?: ShopperProfile | null;
  message?: string;
}): Promise<CompatResponse> {
  requireProduct(input.productId);
  const opened = (await startNegotiation({
    productId: input.productId,
    buyerName: input.shopper?.name,
    buyerProfile: input.shopper
      ? {
          waist: input.shopper.waist,
          length: input.shopper.length,
          budgetMax: input.shopper.budgetMax,
          preferredBrands: input.shopper.preferredBrands,
        }
      : null,
  })) as unknown as View & { merchantReply: string };
  if (input.message?.trim()) {
    return compatMessage({ negotiationId: opened.negotiationId, message: input.message });
  }
  return respond(opened, opened.merchantReply);
}

export async function compatMessage(input: {
  negotiationId: string;
  message: string;
  structured?: Partial<BuyerTurn>;
}): Promise<CompatResponse> {
  const before = (await fetchNegotiation(input.negotiationId)) as unknown as View;
  if (before.status === "agreed" && !input.structured) {
    // Deal already agreed: small talk only, keep pointing at the deal
    return respond(before, `We're agreed — ${toLegacyDeal(before, before.agreedDeal).summary}. Apply the deal to check out.`);
  }
  const turn = parseBuyerText(input.message, before, input.structured);
  const after = (await sendMessage(input.negotiationId, turn)) as unknown as View & { merchantReply: string };
  return respond(after, after.merchantReply);
}

/**
 * Stateless callers (the on-site deal desk, the MCP tool) send back the deal
 * they got last time; its negotiationId lets us continue the same session.
 */
export async function compatStateless(input: {
  productId: string;
  message?: string;
  negotiationId?: string | null;
  shopper?: ShopperProfile | null;
  structured?: Partial<BuyerTurn>;
}): Promise<CompatResponse> {
  if (input.negotiationId) {
    try {
      const view = (await fetchNegotiation(input.negotiationId)) as unknown as View;
      if (view.product.id === input.productId && view.status !== "purchased") {
        if (!input.message?.trim() && !input.structured) return respond(view, "Here's where we are.");
        return await compatMessage({
          negotiationId: input.negotiationId,
          message: input.message ?? "",
          structured: input.structured,
        });
      }
    } catch (err) {
      if (!(err instanceof NegotiationError && err.status === 404)) throw err;
    }
  }
  return compatStart({ productId: input.productId, shopper: input.shopper, message: input.message });
}

/**
 * Buy the deal on a negotiation for connectors that place orders directly:
 * accept the lead deal if nothing is agreed yet, then purchase at its price.
 */
export async function compatPurchase(input: {
  negotiationId: string;
  buyerName: string;
  buyerEmail: string;
  shippingCity: string;
  note?: string;
}) {
  let view = (await fetchNegotiation(input.negotiationId)) as unknown as View;
  if (view.status === "open") {
    const offer = leadOffer(view);
    if (!offer) throw new NegotiationError(409, "No deal on the table to buy.");
    view = (await sendMessage(input.negotiationId, {
      message: "We'll take the deal.",
      acceptOfferId: offer.offerId,
    })) as unknown as View;
  }
  if (!view.agreedDeal) throw new NegotiationError(409, "No agreed deal to buy.");
  return purchaseDeal(input.negotiationId, { ...input, price: view.agreedDeal.price });
}

