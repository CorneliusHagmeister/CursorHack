import { NextResponse } from "next/server";
import { getProduct, getPerkOptions } from "@/lib/products";
import { gbp } from "@/lib/format";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) {
    return new NextResponse("# Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  const perks = getPerkOptions(id);
  const lines = [
    `# ${product.brand} ${product.name}`,
    "",
    `${gbp(product.price)} · W${product.waist} L${product.length} · ${product.condition}`,
    "",
    product.description,
    "",
    `Seller in ${product.city}.`,
    "",
    "## Actions",
    "",
    `- Buy now: POST /api/v1/orders with primaryId=${product.id}`,
    `- Make an offer: POST /api/v1/negotiations with productId=${product.id}`,
    "",
    "## Bundle options",
    "",
    ...(perks.length
      ? perks.map((p) => `- ${p.brand} ${p.name} (${gbp(p.price)} free)`)
      : ["- None for this listing"]),
    "",
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
