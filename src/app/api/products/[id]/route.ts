import { NextResponse } from "next/server";
import { getPerkOptions, getProduct } from "@/lib/products";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const product = getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    product,
    perkOptions: getPerkOptions(id),
  });
}
