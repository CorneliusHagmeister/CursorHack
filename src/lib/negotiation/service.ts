import { randomUUID } from "crypto";
import { getProduct } from "@/lib/products";
import { createOrder } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";
import {
  NegotiationError,
  applyBuyerTurn,
  openingTerms,
  requireProduct,
} from "./engine";
import { SESSION_TTL_SECONDS, getNegotiation, saveNegotiation } from "./sessions";
import type { BuyerTurn, Negotiation } from "./types";
import { merchantReply } from "./voice";

function guidance(neg: Negotiation): string {
  switch (neg.status) {
    case "open":
      return [
        "Send a message with counterOffer (GBP number) to haggle; set includePerk=true to counter on the Pair & Perk bundle instead.",
        "Send acceptOfferId (one of offers[].offerId) to lock in a deal.",
        neg.finalOfferMade
          ? "The merchant is at best-and-final: lower counters will not move the price."
          : "",
      ]
        .filter(Boolean)
        .join(" ");
    case "agreed":
      return `Deal agreed at £${neg.agreed?.price}. Confirm with the user, then call purchaseNegotiatedDeal with price=${neg.agreed?.price} and their name, email and shipping city.`;
    case "purchased":
      return `Purchased. Order id ${neg.orderId}.`;
  }
}

/** The shape agents see — no floor prices or internal counters */
export function publicView(neg: Negotiation, opts: { transcript?: boolean } = {}) {
  const product = requireProduct(neg.productId);
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
    finalOffer: neg.finalOfferMade,
    offers: neg.status === "open" ? neg.offers : [],
    agreedDeal: neg.agreed,
    orderId: neg.orderId,
    expiresAt: neg.expiresAt,
    guidance: guidance(neg),
    ...(opts.transcript ? { transcript: neg.transcript } : {}),
  };
}

async function load(id: string): Promise<Negotiation> {
  const neg = await getNegotiation(id);
  if (!neg) throw new NegotiationError(404, `Negotiation "${id}" not found or expired`);
  return neg;
}

export async function startNegotiation(input: {
  productId: string;
  buyerName?: string;
  perkId?: string;
}) {
  const product = requireProduct(input.productId);
  const now = new Date();
  let neg: Negotiation = {
    id: `neg_${randomUUID().replace(/-/g, "")}`,
    productId: product.id,
    listPrice: product.price,
    buyerName: input.buyerName,
    status: "open",
    ...openingTerms(product, input.perkId),
    agreed: null,
    orderId: null,
    transcript: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };
  const reply = await merchantReply(neg, { type: "opening" }, product);
  neg = {
    ...neg,
    transcript: [{ role: "merchant", text: reply.text, at: now.toISOString() }],
  };
  await saveNegotiation(neg);
  return { merchantReply: reply.text, replySource: reply.source, ...publicView(neg) };
}

export async function sendMessage(id: string, turn: BuyerTurn) {
  const current = await load(id);
  const product = requireProduct(current.productId);
  const { next, decision } = applyBuyerTurn(current, turn);
  const reply = await merchantReply(next, decision, product, turn.message, turn.counterOffer);
  const neg: Negotiation = {
    ...next,
    transcript: [
      ...next.transcript,
      { role: "merchant", text: reply.text, at: new Date().toISOString() },
    ],
  };
  await saveNegotiation(neg);
  return {
    merchantReply: reply.text,
    replySource: reply.source,
    decision: decision.type,
    ...publicView(neg),
  };
}

export async function fetchNegotiation(id: string) {
  return publicView(await load(id), { transcript: true });
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

  const product = requireProduct(neg.productId);
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

  const order = await createOrder({
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    shippingCity: input.shippingCity,
    note: input.note,
    items,
    subtotal: product.price + perkSavings,
    perkSavings,
    total: deal.price,
    listPrice: product.price,
    discount: Math.max(0, product.price - deal.price),
    mechanic: deal.price < product.price ? "negotiated-pair-and-perk" : "pair-and-perk",
    negotiationSummary: `Agent API negotiation ${neg.id} (${neg.round} counter${neg.round === 1 ? "" : "s"}): list £${product.price} → £${deal.price}${
      perk ? ` + ${perk.brand} ${perk.name} free` : ""
    }.`,
  });

  const done: Negotiation = {
    ...neg,
    status: "purchased",
    orderId: order.id,
    updatedAt: new Date().toISOString(),
  };
  await saveNegotiation(done);
  return { order, negotiation: publicView(done) };
}
