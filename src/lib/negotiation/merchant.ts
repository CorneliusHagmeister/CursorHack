import { getPerkOptions, getProduct } from "@/lib/products";
import { applyBuyerTurn, policySummary, requireProduct } from "./engine";
import { normalizePolicy } from "./policies";
import { newNegotiation } from "./service";
import { listRecentNegotiations } from "./sessions";
import type { BuyerTurn, Negotiation, PricingContext, ProductPolicy } from "./types";
import { merchantReply, templateReply } from "./voice";

/** Perk pairs a merchant can choose to allow with a product */
export function perkOptionsFor(productId: string) {
  return getPerkOptions(productId).map((p) => ({
    productId: p.id,
    brand: p.brand,
    name: p.name,
    listPrice: p.price,
    image: p.image,
  }));
}

/**
 * Run one simulator step against an unsaved policy. Nothing is stored: the
 * client holds the negotiation and sends it back with the next turn.
 */
export async function simulate(input: {
  productId: string;
  policy: ProductPolicy;
  negotiation?: Negotiation | null;
  turn?: BuyerTurn | null;
  voice?: "template" | "llm";
}) {
  const product = requireProduct(input.productId);
  const ctx: PricingContext = { product, policy: normalizePolicy(product, input.policy) };
  const phrase = async (...args: Parameters<typeof templateReply>) =>
    input.voice === "llm"
      ? (await merchantReply(args[0], args[1], args[2], input.turn?.message, args[3])).text
      : templateReply(...args);

  if (!input.negotiation || !input.turn) {
    const neg = newNegotiation(ctx);
    const reply = await phrase(neg, { type: "opening" }, ctx);
    return { summary: policySummary(ctx), negotiation: neg, decision: "opening", reply };
  }
  const { next, decision } = applyBuyerTurn(input.negotiation, input.turn, ctx);
  const reply = await phrase(next, decision, ctx, input.turn.counterOffer);
  return { summary: policySummary(ctx), negotiation: next, decision: decision.type, reply };
}

/** Recent negotiations shaped for the merchant's live view */
export async function liveFeed() {
  const negs = await listRecentNegotiations();
  return negs.map((n) => {
    const product = getProduct(n.productId);
    return {
      id: n.id,
      status: n.status,
      buyerName: n.buyerName ?? "Anonymous agent",
      product: product
        ? { id: product.id, brand: product.brand, name: product.name, image: product.image, listPrice: product.price }
        : { id: n.productId, brand: "", name: n.productId, image: null, listPrice: n.listPrice },
      offers: n.status === "open" ? n.offers : [],
      agreed: n.agreed,
      orderId: n.orderId,
      transcript: n.transcript,
      updatedAt: n.updatedAt,
    };
  });
}
