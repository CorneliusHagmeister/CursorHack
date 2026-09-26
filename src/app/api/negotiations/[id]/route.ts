import { handle } from "@/lib/negotiation/http";
import { fetchNegotiation } from "@/lib/negotiation/service";

export async function GET(_req: Request, ctx: RouteContext<"/api/negotiations/[id]">) {
  const { id } = await ctx.params;
  return handle(() => fetchNegotiation(id));
}
