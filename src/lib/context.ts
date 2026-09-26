import { cookies, headers } from "next/headers";
import type { ShopperContext, ShopperProfile } from "./types";
import { DEMO_SHOPPER_COOKIE, RETURNING_SHOPPER } from "./shopper";
import { lookupAgentToken } from "./agent-tokens";
import { getSupabaseShopper } from "./supabase/shopper";
import { isSupabaseConfigured } from "./supabase/server";

const CAMPAIGN_HINTS: Record<string, string> = {
  "raw-denim": "raw denim",
  "budget-under-90": "under £90",
  taper: "slim taper",
  fleek: "Fleek picks",
};

function campaignFromSearch(searchParams?: URLSearchParams): string | undefined {
  if (!searchParams) return undefined;
  const raw =
    searchParams.get("utm_campaign") ??
    searchParams.get("campaign") ??
    searchParams.get("utm_content") ??
    undefined;
  if (!raw) return undefined;
  const key = raw.toLowerCase().trim();
  return CAMPAIGN_HINTS[key] ?? raw.replace(/[-_]+/g, " ");
}

async function shopperFromAuth(): Promise<ShopperProfile | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    return await getSupabaseShopper();
  } catch {
    return undefined;
  }
}

/**
 * Resolve who is shopping: anonymous, ad campaign, logged-in, or agent bearer.
 * Works without Supabase via demo cookie + seed profile.
 */
export async function resolveShopperContext(options?: {
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined>;
  authorization?: string | null;
}): Promise<ShopperContext> {
  const headerStore = await headers();
  const authHeader =
    options?.authorization ?? headerStore.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    const fromToken = await lookupAgentToken(token);
    if (fromToken) {
      return { source: "agent", shopper: fromToken };
    }
  }

  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_SHOPPER_COOKIE)?.value === "1") {
    const params = toSearchParams(options?.searchParams);
    return {
      source: "login",
      shopper: RETURNING_SHOPPER,
      campaign: campaignFromSearch(params),
    };
  }

  const supabaseShopper = await shopperFromAuth();
  if (supabaseShopper) {
    const params = toSearchParams(options?.searchParams);
    return {
      source: "login",
      shopper: supabaseShopper,
      campaign: campaignFromSearch(params),
    };
  }

  const params = toSearchParams(options?.searchParams);
  const campaign = campaignFromSearch(params);
  if (campaign) {
    return { source: "ad", campaign };
  }

  return { source: "anonymous" };
}

function toSearchParams(
  input?: URLSearchParams | Record<string, string | string[] | undefined>
): URLSearchParams | undefined {
  if (!input) return undefined;
  if (input instanceof URLSearchParams) return input;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export function hasPersonalContext(ctx: ShopperContext): boolean {
  return Boolean(ctx.shopper) && (ctx.source === "login" || ctx.source === "agent");
}
