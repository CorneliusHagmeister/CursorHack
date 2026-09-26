import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { createOrder, listOrders } from "@/lib/store";
import type { OrderItem } from "@/lib/types";

export async function GET() {
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    primaryId,
    perkId,
    buyerName,
    buyerEmail,
    shippingCity,
    note,
  } = body as {
    primaryId?: string;
    perkId?: string | null;
    buyerName?: string;
    buyerEmail?: string;
    shippingCity?: string;
    note?: string;
  };

  if (!primaryId || !buyerName || !buyerEmail || !shippingCity) {
    return NextResponse.json(
      { error: "primaryId, buyerName, buyerEmail, shippingCity required" },
      { status: 400 }
    );
  }

  const primary = getProduct(primaryId);
  if (!primary) {
    return NextResponse.json({ error: "Primary product not found" }, { status: 404 });
  }

  const items: OrderItem[] = [
    {
      productId: primary.id,
      name: primary.name,
      brand: primary.brand,
      price: primary.price,
      role: "primary" as const,
    },
  ];

  let perkSavings = 0;
  if (perkId) {
    const perk = getProduct(perkId);
    if (!perk || !perk.perkEligible) {
      return NextResponse.json({ error: "Invalid perk" }, { status: 400 });
    }
    if (perk.price >= primary.price) {
      return NextResponse.json(
        { error: "Perk must be cheaper than primary" },
        { status: 400 }
      );
    }
    items.push({
      productId: perk.id,
      name: perk.name,
      brand: perk.brand,
      price: 0,
      role: "perk" as const,
    });
    perkSavings = perk.price;
  }

  const subtotal = primary.price + perkSavings;
  const total = primary.price;

  const order = await createOrder({
    buyerName,
    buyerEmail,
    shippingCity,
    items,
    subtotal,
    perkSavings,
    total,
    mechanic: "pair-and-perk",
    note,
  });

  return NextResponse.json({ order }, { status: 201 });
}
