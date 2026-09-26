import { promises as fs } from "fs";
import path from "path";
import type { Order } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

/** Module-level cache — works for local demo + warm serverless instances */
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
    // read-only FS (e.g. some serverless) — memory only
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
