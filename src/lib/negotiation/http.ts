import { NextResponse } from "next/server";
import { NegotiationError } from "./engine";
import { TERM_IDS } from "./policies";
import type { TermId } from "./types";

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  throw new NegotiationError(400, "Request body must be a JSON object");
}

export function optionalString(body: Record<string, unknown>, field: string): string | undefined {
  const v = body[field];
  if (v == null || v === "") return undefined;
  if (typeof v !== "string") throw new NegotiationError(400, `${field} must be a string`);
  return v;
}

export function requiredString(body: Record<string, unknown>, field: string): string {
  const v = optionalString(body, field);
  if (!v) throw new NegotiationError(400, `${field} is required`);
  return v;
}

export function optionalPrice(body: Record<string, unknown>, field: string): number | undefined {
  const v = body[field];
  if (v == null) return undefined;
  const n = typeof v === "string" ? Number(v.replace(/[£,\s]/g, "")) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    throw new NegotiationError(400, `${field} must be a positive number in GBP`);
  }
  return n;
}

export async function handle(fn: () => Promise<unknown>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (err) {
    if (err instanceof NegotiationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export function optionalTerms(body: Record<string, unknown>, field: string): TermId[] | undefined {
  const v = body[field];
  if (v == null) return undefined;
  const list = Array.isArray(v) ? v : [v];
  for (const t of list) {
    if (typeof t !== "string" || !TERM_IDS.includes(t as TermId)) {
      throw new NegotiationError(400, `${field} must be term ids from: ${TERM_IDS.join(", ")}`);
    }
  }
  return list as TermId[];
}
