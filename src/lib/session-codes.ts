import { randomInt } from "crypto";
import type { ShopperProfile } from "./types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const TTL_MS = 10 * 60 * 1000;

type PendingCode = {
  shopper: ShopperProfile;
  expiresAt: number;
};

const pending = new Map<string, PendingCode>();

const normalizeCode = (input: string): string =>
  input.toUpperCase().replace(/[^A-Z0-9]/g, "");

const purgeExpired = (now: number) => {
  for (const [code, record] of pending) {
    if (record.expiresAt <= now) pending.delete(code);
  }
};

const formatCode = (raw: string): string => `${raw.slice(0, 3)} ${raw.slice(3)}`;

export const issueSessionCode = (
  shopper: ShopperProfile
): { code: string; expiresAt: string } => {
  const now = Date.now();
  purgeExpired(now);
  for (const [existing, record] of pending) {
    if (record.shopper.id === shopper.id) pending.delete(existing);
  }

  let raw = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    raw += ALPHABET[randomInt(ALPHABET.length)];
  }

  const expiresAt = now + TTL_MS;
  pending.set(raw, { shopper, expiresAt });
  return { code: formatCode(raw), expiresAt: new Date(expiresAt).toISOString() };
};

/** Single use. Returns the shopper captured when the code was issued. */
export const takeSessionCode = (input: string): ShopperProfile | undefined => {
  const code = normalizeCode(input);
  if (code.length !== CODE_LENGTH) return undefined;
  const record = pending.get(code);
  if (!record) return undefined;
  pending.delete(code);
  if (record.expiresAt <= Date.now()) return undefined;
  return record.shopper;
};
