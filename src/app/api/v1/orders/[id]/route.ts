import { NextResponse } from "next/server";
import { serviceGetOrder } from "@/lib/services";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await serviceGetOrder(id);
  if (!order) {
    return NextResponse.json(
      { error: "Not found", hint: "Check the order id from POST /api/v1/orders" },
      { status: 404 }
    );
  }
  return NextResponse.json({ order });
}
