import type { ShopperProfile } from "../types";
import { createServerSupabaseClient } from "./server";

export async function getSupabaseShopper(): Promise<ShopperProfile | undefined> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;

  const { data: row } = await supabase
    .from("il_shoppers")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!row) return undefined;

  const { data: purchases } = await supabase
    .from("il_past_purchases")
    .select("*")
    .eq("shopper_id", row.id)
    .order("purchased_at", { ascending: false });

  return {
    id: row.id,
    name: row.name,
    email: row.email ?? user.email ?? "",
    city: row.city ?? "",
    waist: row.waist,
    length: row.length,
    preferredBrands: row.preferred_brands ?? [],
    minCondition: row.min_condition,
    budgetMax: row.budget_max,
    styleLikes: row.style_likes ?? [],
    pastPurchases: (purchases ?? []).map((p) => ({
      productId: p.product_id ?? undefined,
      brand: p.brand,
      name: p.name,
      waist: p.waist,
      condition: p.condition,
      price: Number(p.price),
      purchasedAt: p.purchased_at,
      note: p.note ?? "",
    })),
    returningVisits: row.returning_visits ?? 1,
    lastSeenNote: row.last_seen_note ?? "",
  };
}
