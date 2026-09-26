import { promises as fs } from "fs";
import path from "path";
import type { Order } from "./types";
import { createAdminClient } from "./supabase/server";

function stageOrder(): Order {
  return {
    id: "ord_stage_seed",
    createdAt: "2026-09-20T11:00:00.000Z",
    buyerName: "Sam Okonkwo",
    buyerEmail: "sam.okonkwo@example.com",
    shippingCity: "London",
    items: [
      {
        productId: "nudie-lean-dean",
        name: "Lean Dean Organic",
        brand: "Nudie Jeans",
        price: 55,
        role: "primary",
      },
      {
        productId: "dickies-872",
        name: "872 Slim Fit Work Pant",
        brand: "Dickies",
        price: 0,
        role: "perk",
      },
    ],
    subtotal: 55,
    perkSavings: 28,
    total: 55,
    listPrice: 55,
    discount: 0,
    mechanic: "negotiated-pair-and-perk",
    status: "shipped",
    note: "Earlier visit, already fulfilled.",
    negotiationSummary: "Nudie Lean Dean at £55 with a free Dickies perk.",
    shopperId: "shopper_sam_okonkwo",
    channel: "web",
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

/** Module-level cache. Fine for the local demo and a warm serverless instance. */
let memoryOrders: Order[] | null = null;

async function ensureFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(ORDERS_FILE);
    } catch {
      await fs.writeFile(ORDERS_FILE, "[]", "utf8");
    }
  } catch {
    // read-only FS, so keep orders in memory only
  }
}

async function load(): Promise<Order[]> {
  if (memoryOrders) return memoryOrders;
  await ensureFile();
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    memoryOrders = JSON.parse(raw) as Order[];
  } catch {
    memoryOrders = [];
  }
  if (memoryOrders.length === 0) {
    memoryOrders = [stageOrder()];
    await persist(memoryOrders);
  }
  return memoryOrders;
}

/**
 * Orders live in Supabase when it is configured, so every serverless instance
 * sees the same orders. The JSON file stays as the local fallback.
 */
type OrderRow = {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  shipping_city: string;
  items: Order["items"];
  subtotal: number;
  perk_savings: number;
  total: number;
  list_price: number;
  discount: number;
  mechanic: Order["mechanic"];
  status: Order["status"];
  note: string | null;
  negotiation_summary: string | null;
  shopper_id: string | null;
  channel: Order["channel"] | null;
};

function toRow(o: Order): OrderRow {
  return {
    id: o.id,
    created_at: o.createdAt,
    buyer_name: o.buyerName,
    buyer_email: o.buyerEmail,
    shipping_city: o.shippingCity,
    items: o.items,
    subtotal: o.subtotal,
    perk_savings: o.perkSavings,
    total: o.total,
    list_price: o.listPrice,
    discount: o.discount,
    mechanic: o.mechanic,
    status: o.status,
    note: o.note ?? null,
    negotiation_summary: o.negotiationSummary ?? null,
    shopper_id: o.shopperId ?? null,
    channel: o.channel ?? "web",
  };
}

function fromRow(r: OrderRow): Order {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toISOString(),
    buyerName: r.buyer_name,
    buyerEmail: r.buyer_email,
    shippingCity: r.shipping_city,
    items: r.items,
    subtotal: Number(r.subtotal),
    perkSavings: Number(r.perk_savings),
    total: Number(r.total),
    listPrice: Number(r.list_price),
    discount: Number(r.discount),
    mechanic: r.mechanic,
    status: r.status,
    note: r.note ?? undefined,
    negotiationSummary: r.negotiation_summary ?? undefined,
    shopperId: r.shopper_id ?? undefined,
    channel: r.channel ?? undefined,
  };
}

async function dbListOrders(): Promise<Order[] | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db.from("il_orders").select("*");
  if (error) return null;
  const orders = (data as OrderRow[]).map(fromRow);
  if (!orders.some((o) => o.id === "ord_stage_seed")) {
    const seed = stageOrder();
    await db.from("il_orders").upsert(toRow(seed));
    orders.push(seed);
  }
  return orders;
}

async function dbGetOrder(id: string): Promise<Order | null | undefined> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db.from("il_orders").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  if (!data && id === "ord_stage_seed") return stageOrder();
  return data ? fromRow(data as OrderRow) : undefined;
}

async function dbSaveOrder(order: Order): Promise<boolean> {
  const db = createAdminClient();
  if (!db) return false;
  const { error } = await db.from("il_orders").upsert(toRow(order));
  return !error;
}

async function persist(orders: Order[]): Promise<void> {
  memoryOrders = orders;
  try {
    await ensureFile();
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
  } catch {
    // ignore persist failures on read-only FS
  }
}

export async function listOrders(): Promise<Order[]> {
  const orders = (await dbListOrders()) ?? (await load());
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const fromDb = await dbGetOrder(id);
  if (fromDb !== null) return fromDb;
  const orders = await load();
  return orders.find((o) => o.id === id);
}

export async function createOrder(
  input: Omit<Order, "id" | "createdAt" | "status">
): Promise<Order> {
  const orders = await load();
  const order: Order = {
    ...input,
    id: `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };
  orders.push(order);
  await persist(orders);
  await dbSaveOrder(order);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<Order | undefined> {
  const current = await getOrder(id);
  if (!current) return undefined;
  const updated: Order = { ...current, status };
  await dbSaveOrder(updated);
  const orders = await load();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx >= 0) {
    orders[idx] = updated;
    await persist(orders);
  }
  return updated;
}
