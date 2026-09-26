import { promises as fs } from "fs";
import path from "path";
import type { Order } from "./types";

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
  const orders = await load();
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrder(id: string): Promise<Order | undefined> {
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
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<Order | undefined> {
  const orders = await load();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  orders[idx] = { ...orders[idx], status };
  await persist(orders);
  return orders[idx];
}
