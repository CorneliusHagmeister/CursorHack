import { NextResponse } from "next/server";
import {
  serviceGetProduct,
  serviceSearchProducts,
} from "@/lib/services";
import type { Condition } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const products = serviceSearchProducts({
    q: url.searchParams.get("q") ?? undefined,
    waist: url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : url.searchParams.get("waist")
        ? Number(url.searchParams.get("waist"))
        : undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    condition: (url.searchParams.get("condition") as Condition) || undefined,
    cut: url.searchParams.get("cut") ?? undefined,
    maxPrice: url.searchParams.get("max_price")
      ? Number(url.searchParams.get("max_price"))
      : undefined,
  });
  return NextResponse.json({ products, count: products.length });
}
