import { NextResponse } from "next/server";
import { listProducts } from "@/lib/products";
import { gbp } from "@/lib/format";

export async function GET() {
  const products = listProducts();
  const lines = [
    "# Indigo Lane",
    "",
    "Second-hand denim shop. Browse anonymously. Sign in or send an agent bearer token to unlock fit and budget context on the product page.",
    "",
    "## Catalogue",
    "",
    ...products.map(
      (p) =>
        `- [${p.brand} ${p.name}](/product/${p.id}) · W${p.waist} · ${p.condition} · ${gbp(p.price)}${p.perkEligible ? " · bundle eligible" : ""}`
    ),
    "",
    "## Agent access",
    "",
    "- REST: `/api/v1/products`, `/api/v1/negotiations`, `/api/v1/orders`",
    "- MCP: `/api/mcp` or `/mcp/http`",
    "- OpenAPI: `/openapi.json`",
    "- Auth: `Authorization: Bearer <agent token>` or demo token `il_demo_agent_token`",
    "",
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
