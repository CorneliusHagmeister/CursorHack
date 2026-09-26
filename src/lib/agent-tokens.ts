import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { ShopperProfile } from "./types";
import { RETURNING_SHOPPER } from "./shopper";
import { isSupabaseConfigured, createAdminClient } from "./supabase/server";

export type AgentTokenRecord = {
  id: string;
  shopperId: string;
  label: string;
  tokenHash: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const TOKENS_FILE = path.join(DATA_DIR, "agent-tokens.json");

let memoryTokens: AgentTokenRecord[] | null = null;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function loadTokens(): Promise<AgentTokenRecord[]> {
  if (memoryTokens) return memoryTokens;
  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf8");
    memoryTokens = JSON.parse(raw) as AgentTokenRecord[];
  } catch {
    memoryTokens = [];
  }
  return memoryTokens;
}

async function persistTokens(tokens: AgentTokenRecord[]): Promise<void> {
  memoryTokens = tokens;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf8");
  } catch {
    // ignore read-only FS
  }
}

export async function createAgentToken(input: {
  shopperId: string;
  label?: string;
}): Promise<{ token: string; record: AgentTokenRecord }> {
  const raw = `il_${randomBytes(24).toString("hex")}`;
  const record: AgentTokenRecord = {
    id: `tok_${Date.now().toString(36)}`,
    shopperId: input.shopperId,
    label: input.label ?? "Agent token",
    tokenHash: hashToken(raw),
    prefix: raw.slice(0, 10),
    scopes: ["products:read", "negotiate", "orders:write", "orders:read"],
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (admin) {
        await admin.from("il_agent_tokens").insert({
          id: record.id,
          shopper_id: record.shopperId,
          label: record.label,
          token_hash: record.tokenHash,
          prefix: record.prefix,
          scopes: record.scopes,
          created_at: record.createdAt,
        });
        return { token: raw, record };
      }
    } catch {
      // fall through to file store
    }
  }

  const tokens = await loadTokens();
  tokens.push(record);
  await persistTokens(tokens);
  return { token: raw, record };
}

export async function lookupAgentToken(
  token: string
): Promise<ShopperProfile | undefined> {
  if (!token) return undefined;
  const hashed = hashToken(token);

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data } = await admin
          .from("il_agent_tokens")
          .select("shopper_id")
          .eq("token_hash", hashed)
          .maybeSingle();
        if (data?.shopper_id) {
          const { data: shopper } = await admin
            .from("il_shoppers")
            .select("*")
            .eq("id", data.shopper_id)
            .maybeSingle();
          if (shopper) {
            return mapShopperRow(shopper);
          }
        }
      }
    } catch {
      // fall through
    }
  }

  const tokens = await loadTokens();
  const hit = tokens.find((t) => t.tokenHash === hashed);
  if (!hit) {
    // Stage convenience: accept literal demo token
    if (token === "il_demo_agent_token") return RETURNING_SHOPPER;
    return undefined;
  }
  if (hit.shopperId === RETURNING_SHOPPER.id) return RETURNING_SHOPPER;
  return RETURNING_SHOPPER;
}

export async function listAgentTokens(
  shopperId: string
): Promise<Omit<AgentTokenRecord, "tokenHash">[]> {
  const tokens = await loadTokens();
  return tokens
    .filter((t) => t.shopperId === shopperId)
    .map(({ tokenHash: _h, ...rest }) => rest);
}

function mapShopperRow(row: Record<string, unknown>): ShopperProfile {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    city: String(row.city ?? ""),
    waist: Number(row.waist),
    length: Number(row.length),
    preferredBrands: (row.preferred_brands as string[]) ?? [],
    minCondition: (row.min_condition as ShopperProfile["minCondition"]) ?? "Good",
    budgetMax: Number(row.budget_max),
    styleLikes: (row.style_likes as string[]) ?? [],
    pastPurchases: [],
    returningVisits: Number(row.returning_visits ?? 1),
    lastSeenNote: String(row.last_seen_note ?? ""),
  };
}
