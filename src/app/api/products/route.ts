import { NextResponse } from "next/server";
import { listProducts } from "@/lib/products";

export async function GET() {
  return NextResponse.json({ products: listProducts() });
}
