import type { NegotiatedDeal, NegotiateMessage } from "./types";

type Session = {
  productId: string;
  history: NegotiateMessage[];
  deal: NegotiatedDeal | null;
};

const sessions = new Map<string, Session>();

export function getNegotiationSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function setNegotiationSession(id: string, value: Session): void {
  sessions.set(id, value);
}
