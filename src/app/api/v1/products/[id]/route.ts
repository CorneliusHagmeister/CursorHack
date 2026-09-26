import { NextResponse } from "next/server";
import { serviceGetPerkOptions, serviceGetProduct } from "@/lib/services";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = serviceGetProduct(id);
  if (!product) {
    return NextResponse.json(
      { error: "Not found", hint: "GET /api/v1/products for the catalogue" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    product,
    perkOptions: serviceGetPerkOptions(id),
  });
}
