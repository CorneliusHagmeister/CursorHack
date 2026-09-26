import { getProduct, getPerkOptions, searchProducts } from "../products";
import { runNegotiate } from "../negotiate";
import {
  createOrder,
  getOrder as getStoredOrder,
  listOrders as listStoredOrders,
} from "../store";
import type {
  NegotiatedDeal,
  NegotiateMessage,
  NegotiateResponse,
  Order,
  OrderChannel,
  Product,
  ProductFilters,
  ShopperProfile,
} from "../types";

export function serviceSearchProducts(filters: ProductFilters = {}): Product[] {
  return searchProducts(filters);
}

export function serviceGetProduct(id: string): Product | undefined {
  return getProduct(id);
}

export function serviceGetPerkOptions(primaryId: string): Product[] {
  return getPerkOptions(primaryId);
}

export function serviceNegotiate(input: {
  productId: string;
  message?: string;
  history?: NegotiateMessage[];
  deal?: NegotiatedDeal | null;
  shopper?: ShopperProfile | null;
  campaign?: string | null;
}): NegotiateResponse {
  return runNegotiate({
    productId: input.productId,
    message: input.message ?? "",
    history: input.history ?? [],
    deal: input.deal ?? null,
    shopper: input.shopper ?? null,
    campaign: input.campaign ?? null,
  });
}

export type PlaceOrderInput = {
  primaryId: string;
  perkId?: string | null;
  buyerName: string;
  buyerEmail: string;
  shippingCity: string;
  note?: string;
  negotiatedPrice?: number;
  listPrice?: number;
  negotiationSummary?: string;
  concessions?: string;
  negotiated?: boolean;
  shopperId?: string;
  channel?: OrderChannel;
};

export async function servicePlaceOrder(input: PlaceOrderInput): Promise<Order> {
  const primary = getProduct(input.primaryId);
  if (!primary) throw new Error("Primary product not found");

  const perk = input.perkId ? getProduct(input.perkId) : undefined;
  const listPrice = input.listPrice ?? primary.price;
  const total = input.negotiatedPrice ?? primary.price;
  const perkSavings = perk?.price ?? 0;

  return createOrder({
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    shippingCity: input.shippingCity,
    items: [
      {
        productId: primary.id,
        name: primary.name,
        brand: primary.brand,
        price: total,
        role: "primary",
      },
      ...(perk
        ? [
            {
              productId: perk.id,
              name: perk.name,
              brand: perk.brand,
              price: 0,
              role: "perk" as const,
            },
          ]
        : []),
    ],
    subtotal: total,
    perkSavings,
    total,
    listPrice,
    discount: Math.max(0, listPrice - total),
    mechanic: input.negotiated
      ? "negotiated-pair-and-perk"
      : "pair-and-perk",
    note: input.note,
    negotiationSummary: input.negotiationSummary,
    shopperId: input.shopperId,
    channel: input.channel ?? "web",
  });
}

export async function serviceGetOrder(id: string): Promise<Order | undefined> {
  return getStoredOrder(id);
}

export async function serviceListOrders(): Promise<Order[]> {
  return listStoredOrders();
}
