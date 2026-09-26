import { randomUUID } from "crypto";
import { getProduct } from "@/lib/products";
import { createOrder } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";
import {
  NegotiationError,
  applyBuyerTurn,
  availableExtras,
  availableTerms,
  dealValue,
  extraLabels,
  openingTerms,
  perkOptions,
  termLabels,
} from "./engine";
import { getPricingContext } from "./policies";
import { SESSION_TTL_SECONDS, getNegotiation, saveNegotiation } from "./sessions";
import type { BuyerTurn, Decision, Negotiation, Offer, PricingContext } from "./types";
import { merchantReply } from "./voice";

function guidance(neg: Negotiation): string {
  switch (neg.status) {
    case "open":
      return [
        "The merchant sells deals, not discounts: see negotiables for what it will flex on (commitments it trades price for, value it can add, free pairs).",
        "Send offerTerms (commitment ids) to get a deal quote, or counterOffer (GBP) and the merchant will propose the deal that makes it work; set includePerk=true to negotiate the Pair & Perk bundle.",
        "Send acceptOfferId (one of offers[].offerId) to lock in a deal. Tell the user what each deal gives them (dealValue, perk, extras) and what it commits them to before accepting.",
      ].join(" ");
    case "agreed":
      return `Deal agreed at £${neg.agreed?.price}. Confirm with the user, then call purchaseNegotiatedDeal with price=${neg.agreed?.price} and their name, email and shipping city.`;
    case "purchased":
      return `Purchased. Order id ${neg.orderId}.`;
  }
}

/** The shape agents see — no floor prices or internal counters */
export function publicView(
  neg: Negotiation,
  ctx: PricingContext,
  opts: { transcript?: boolean } = {}
) {
  const { product } = ctx;
  return {
    negotiationId: neg.id,
    status: neg.status,
    currency: "GBP",
    product: {
      id: product.id,
      brand: product.brand,
      name: product.name,
      listPrice: product.price,
      waist: product.waist,
      length: product.length,
      condition: product.condition,
    },
    round: neg.round,
    // What the merchant will flex on. Floors and targets are never exposed.
    negotiables: {
      commitments: availableTerms(ctx),
      valueAdds: availableExtras(ctx).map((id) => ({
        id,
        label: extraLabels([id])[0],
        value: ctx.policy.extras[id].value,
      })),
      freePairs: perkOptions(ctx).map((p) => ({
        productId: p.id,
        brand: p.brand,
        name: p.name,
        listPrice: p.price,
      })),
    },
    availableTerms: availableTerms(ctx),
    offers: (neg.status === "open" ? neg.offers : []).map((o) => ({ ...o, dealValue: dealValue(ctx, o) })),
    agreedDeal: neg.agreed ? { ...neg.agreed, dealValue: dealValue(ctx, neg.agreed) } : null,
    orderId: neg.orderId,
    expiresAt: neg.expiresAt,
    guidance: guidance(neg),
    ...(opts.transcript ? { transcript: neg.transcript } : {}),
  };
}

/** The offer a merchant message is about, shown as a card in the dashboard */
function offerFor(decision: Decision, neg: Negotiation): Offer | null {
  switch (decision.type) {
    case "accept_offer":
    case "accept_counter":
    case "conditional":
    case "quote":
    case "counter":
      return decision.offer;
    case "opening":
      return neg.offers.find((o) => o.perk) ?? null;
    case "info":
      return null;
  }
}

async function load(id: string): Promise<Negotiation> {
  const neg = await getNegotiation(id);
  if (!neg) throw new NegotiationError(404, `Negotiation "${id}" not found or expired`);
  return neg;
}

async function pricing(productId: string): Promise<PricingContext> {
  const ctx = await getPricingContext(productId);
  if (!ctx) throw new NegotiationError(404, `Unknown productId "${productId}"`);
  return ctx;
}

export async function startNegotiation(input: {
  productId: string;
  buyerName?: string;
  perkId?: string;
}) {
  const ctx = await pricing(input.productId);
  let neg = newNegotiation(ctx, input);
  const now = new Date();
  const reply = await merchantReply(neg, { type: "opening" }, ctx);
  neg = {
    ...neg,
    transcript: [
      {
        role: "merchant",
        text: reply.text,
        decision: "opening",
        offer: offerFor({ type: "opening" }, neg),
        at: now.toISOString(),
      },
    ],
  };
  await saveNegotiation(neg, { newEntries: 1, decision: "opening" });
  return { merchantReply: reply.text, replySource: reply.source, ...publicView(neg, ctx) };
}

/** A fresh, unsaved negotiation (also used by the merchant simulator) */
export function newNegotiation(
  ctx: PricingContext,
  input: { buyerName?: string; perkId?: string } = {}
): Negotiation {
  const { product } = ctx;
  const now = new Date();
  return {
    id: `neg_${randomUUID().replace(/-/g, "")}`,
    productId: product.id,
    listPrice: product.price,
    buyerName: input.buyerName,
    status: "open",
    ...openingTerms(ctx, input.perkId),
    agreed: null,
    orderId: null,
    transcript: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };
}

export async function sendMessage(id: string, turn: BuyerTurn) {
  const current = await load(id);
  const ctx = await pricing(current.productId);
  const { next, decision } = applyBuyerTurn(current, turn, ctx);
  // Buyer line goes out first so the dashboard can show it (and "typing…")
  // while the merchant reply is being written
  await saveNegotiation(next, { newEntries: 1 });
  const reply = await merchantReply(next, decision, ctx, turn.message, turn.counterOffer);
  const neg: Negotiation = {
    ...next,
    updatedAt: new Date().toISOString(),
    transcript: [
      ...next.transcript,
      {
        role: "merchant",
        text: reply.text,
        decision: decision.type,
        offer: offerFor(decision, next),
        at: new Date().toISOString(),
      },
    ],
  };
  await saveNegotiation(neg, { newEntries: 1, decision: decision.type });
  return {
    merchantReply: reply.text,
    replySource: reply.source,
    decision: decision.type,
    ...publicView(neg, ctx),
  };
}

export async function fetchNegotiation(id: string) {
  const neg = await load(id);
  return publicView(neg, await pricing(neg.productId), { transcript: true });
}

export async function purchaseDeal(
  id: string,
  input: {
    price: number;
    buyerName: string;
    buyerEmail: string;
    shippingCity: string;
    note?: string;
  }
): Promise<{ order: Order; negotiation: ReturnType<typeof publicView> }> {
  const neg = await load(id);
  if (neg.status === "purchased") {
    throw new NegotiationError(409, `Already purchased as order ${neg.orderId}.`);
  }
  if (neg.status !== "agreed" || !neg.agreed) {
    throw new NegotiationError(
      409,
      "No deal agreed yet. Accept an offer (acceptOfferId) or have a counter-offer accepted first."
    );
  }
  const deal = neg.agreed;
  if (input.price !== deal.price) {
    throw new NegotiationError(
      409,
      `Price mismatch: the agreed price is £${deal.price}, not £${input.price}.`
    );
  }

  const ctx = await pricing(neg.productId);
  const { product } = ctx;
  const items: OrderItem[] = [
    {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: deal.price,
      role: "primary",
    },
  ];
  const perk = deal.perk ? getProduct(deal.perk.productId) : undefined;
  if (perk) {
    items.push({
      productId: perk.id,
      name: perk.name,
      brand: perk.brand,
      price: 0,
      role: "perk",
    });
  }
  const perkSavings = perk?.price ?? 0;
  const terms = termLabels(deal.terms);
  const termsNote = terms.length ? `Buyer agreed: ${terms.join("; ")}` : "";

  const order = await createOrder({
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    shippingCity: input.shippingCity,
    note: [input.note, termsNote].filter(Boolean).join(" · ") || undefined,
    items,
    subtotal: product.price + perkSavings,
    perkSavings,
    total: deal.price,
    listPrice: product.price,
    discount: Math.max(0, product.price - deal.price),
    mechanic: deal.price < product.price ? "negotiated-pair-and-perk" : "pair-and-perk",
    negotiationSummary: `Agent API negotiation ${neg.id} (${neg.round} round${neg.round === 1 ? "" : "s"}): list £${product.price} → £${deal.price}${
      perk ? ` + ${perk.brand} ${perk.name} free` : ""
    }${terms.length ? ` in exchange for: ${terms.join("; ")}` : ""}.`,
  });

  const done: Negotiation = {
    ...neg,
    status: "purchased",
    orderId: order.id,
    updatedAt: new Date().toISOString(),
  };
  await saveNegotiation(done);
  return { order, negotiation: publicView(done, ctx) };
}
