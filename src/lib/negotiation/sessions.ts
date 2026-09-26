import { createAdminClient } from "@/lib/supabase/server";
import type { Negotiation, TranscriptEntry } from "./types";

export const SESSION_TTL_SECONDS = 60 * 60 * 24;
const MAX_TRANSCRIPT = 40;

/**
 * Storage: Supabase (service role) when configured — il_agent_negotiations
 * plus one row per message, which the merchant dashboard streams with
 * Realtime. Otherwise, or whenever a Supabase call fails (e.g. migrations not
 * applied yet), an in-process map so the API keeps working.
 */

// Survives Next dev hot reloads
const g = globalThis as unknown as { __negotiations?: Map<string, Negotiation> };
const memory = (g.__negotiations ??= new Map<string, Negotiation>());

let lastSupabaseError: string | null = null;

function supabaseFailed(what: string, message: string) {
  if (lastSupabaseError !== message) console.error(`negotiations: ${what} failed, using memory:`, message);
  lastSupabaseError = message;
}

/** Where negotiations are actually going right now (for the dashboard) */
export function storageStatus(): { mode: "supabase" | "memory"; error: string | null } {
  if (!createAdminClient()) return { mode: "memory", error: null };
  return lastSupabaseError ? { mode: "memory", error: lastSupabaseError } : { mode: "supabase", error: null };
}

function isLive(neg: Negotiation | null): neg is Negotiation {
  return Boolean(neg) && new Date(neg!.expiresAt).getTime() >= Date.now();
}

export async function getNegotiation(id: string): Promise<Negotiation | null> {
  const db = createAdminClient();
  if (db) {
    const { data, error } = await db
      .from("il_agent_negotiations")
      .select("state")
      .eq("id", id)
      .maybeSingle();
    if (!error) {
      lastSupabaseError = null;
      const neg = (data?.state as Negotiation | undefined) ?? null;
      if (isLive(neg)) return neg;
    } else {
      supabaseFailed("read", error.message);
    }
  }
  const neg = memory.get(id) ?? null;
  return isLive(neg) ? neg : null;
}

/**
 * Persist the negotiation. The last `newEntries` transcript lines are also
 * written as message rows so the dashboard receives them live.
 */
export async function saveNegotiation(
  neg: Negotiation,
  opts: { newEntries?: number; decision?: string } = {}
): Promise<void> {
  const trimmed: Negotiation = {
    ...neg,
    transcript: neg.transcript.slice(-MAX_TRANSCRIPT),
  };

  const db = createAdminClient();
  if (db) {
    const { error } = await db.from("il_agent_negotiations").upsert({
      id: neg.id,
      product_id: neg.productId,
      buyer_name: neg.buyerName ?? null,
      status: neg.status,
      agreed_price: neg.agreed?.price ?? null,
      state: trimmed,
      created_at: neg.createdAt,
      updated_at: neg.updatedAt,
      expires_at: neg.expiresAt,
    });
    if (error) {
      supabaseFailed("save", error.message);
      memory.set(neg.id, trimmed);
      return;
    }
    lastSupabaseError = null;
    const fresh = opts.newEntries ? neg.transcript.slice(-opts.newEntries) : [];
    if (fresh.length) {
      const { error: msgError } = await db.from("il_agent_negotiation_messages").insert(
        fresh.map((t: TranscriptEntry) => ({
          negotiation_id: neg.id,
          role: t.role,
          text: t.text,
          counter_offer: t.counterOffer ?? null,
          offer_terms: t.offerTerms ?? null,
          decision: t.role === "merchant" ? (opts.decision ?? null) : null,
          created_at: t.at,
        }))
      );
      if (msgError) supabaseFailed("message insert", msgError.message);
    }
    // Keep a memory copy too, so a later Supabase outage doesn't lose the chat
    memory.set(neg.id, trimmed);
    return;
  }

  memory.set(neg.id, trimmed);
}

/** Most recently active negotiations, newest first (merchant dashboard) */
export async function listRecentNegotiations(limit = 25): Promise<Negotiation[]> {
  const db = createAdminClient();
  if (db) {
    const { data, error } = await db
      .from("il_agent_negotiations")
      .select("state")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (!error) {
      lastSupabaseError = null;
      return (data ?? []).map((r) => r.state as Negotiation);
    }
    supabaseFailed("list", error.message);
  }
  return [...memory.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}
