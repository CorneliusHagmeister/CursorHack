"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NegotiatedDeal, NegotiateMessage, Product } from "@/lib/types";
import { gbp } from "@/lib/format";

type Bubble = { role: "user" | "assistant" | "typing"; content: string; id: string };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function NegotiatePanel({ primary }: { primary: Product }) {
  const router = useRouter();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [history, setHistory] = useState<NegotiateMessage[]>([]);
  const [deal, setDeal] = useState<NegotiatedDeal | null>(null);
  const [quick, setQuick] = useState<string[]>([]);
  const [canApply, setCanApply] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [bubbles]);

  const revealSteps = useCallback(async (steps: string[]) => {
    for (const step of steps) {
      const tipId = uid();
      setBubbles((b) => [...b, { role: "typing", content: "…", id: tipId }]);
      await new Promise((r) => setTimeout(r, 420 + Math.min(step.length * 8, 600)));
      setBubbles((b) =>
        b.map((x) =>
          x.id === tipId ? { role: "assistant", content: step, id: tipId } : x
        )
      );
      await new Promise((r) => setTimeout(r, 180));
    }
  }, []);

  const callNegotiate = useCallback(
    async (message: string, hist: NegotiateMessage[], currentDeal: NegotiatedDeal | null) => {
      setBusy(true);
      try {
        const res = await fetch("/api/negotiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: primary.id,
            message,
            history: hist,
            deal: currentDeal,
          }),
        });
        const data = await res.json();
        await revealSteps(data.steps as string[]);
        const assistantText = (data.steps as string[]).join("\n");
        const nextHist: NegotiateMessage[] = [
          ...hist,
          ...(message
            ? [{ role: "user" as const, content: message }]
            : []),
          { role: "assistant", content: assistantText },
        ];
        setHistory(nextHist);
        setDeal(data.deal as NegotiatedDeal);
        setQuick((data.quickReplies as string[]) ?? []);
        setCanApply(Boolean(data.canApply));
      } finally {
        setBusy(false);
      }
    },
    [primary.id, revealSteps]
  );

  async function start() {
    if (started || busy) return;
    setStarted(true);
    await callNegotiate("", [], null);
  }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    if (!started) setStarted(true);
    setInput("");
    setBubbles((b) => [...b, { role: "user", content: message, id: uid() }]);
    await callNegotiate(message, history, deal);
  }

  function applyDeal() {
    if (!deal) return;
    const params = new URLSearchParams({
      primary: deal.primaryId,
      price: String(deal.negotiatedPrice),
      list: String(deal.listPrice),
      summary: deal.summary,
      negotiated: "1",
    });
    if (deal.perkId) params.set("perk", deal.perkId);
    if (deal.concessions.length) {
      params.set("concessions", deal.concessions.join(" · "));
    }
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <section
      id="negotiate"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-950 to-slate-900 px-4 py-3 text-amber-50 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold">Deal desk for {primary.brand}</h2>
        </div>
        {!started ? (
          <button
            type="button"
            onClick={() => void start()}
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-amber-200"
          >
            Start live negotiation
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        )}
      </div>

      <div className="grid gap-0 lg:grid-cols-5">
        <div className="flex flex-col lg:col-span-3">
          <div
            ref={scroller}
            className="h-[340px] space-y-2.5 overflow-y-auto bg-[#faf8f4] px-4 py-4 sm:h-[400px]"
          >
            {!started && (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white/70 px-3 py-4 text-center text-sm text-stone-500">
                Press <strong>Start live negotiation</strong> — the desk greets
                Sam with remembered W31 / APC·Nudie context, then you counter
                on stage.
              </p>
            )}
            {bubbles.map((b) => (
              <div
                key={b.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  b.role === "user"
                    ? "ml-auto bg-indigo-950 text-amber-50"
                    : b.role === "typing"
                      ? "mr-auto bg-white text-stone-400 shadow-sm"
                      : "mr-auto bg-white text-stone-800 shadow-sm"
                }`}
              >
                {b.role === "typing" ? (
                  <span className="inline-flex gap-1 px-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce [animation-delay:120ms]">·</span>
                    <span className="animate-bounce [animation-delay:240ms]">·</span>
                  </span>
                ) : (
                  b.content
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 bg-white p-3">
            {quick.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {quick.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (q.toLowerCase().includes("checkout") || q.toLowerCase().includes("apply")) {
                        if (canApply && deal) applyDeal();
                        else void send(q);
                      } else {
                        void send(q);
                      }
                    }}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy || !started}
                placeholder={
                  started
                    ? "Counter: price, perk, condition…"
                    : "Start negotiation first"
                }
                className="flex-1 rounded-xl border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !started || !input.trim()}
                className="rounded-xl bg-indigo-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <aside className="border-t border-stone-200 bg-indigo-50/40 p-4 lg:border-l lg:border-t-0 lg:col-span-2">
          <p className="text-sm font-medium text-indigo-950">Working deal</p>
          {deal ? (
            <div className="mt-2 space-y-2 text-sm">
              <p className="font-medium text-indigo-950">{deal.summary}</p>
              <div className="flex items-baseline justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-stone-500">You pay</span>
                <span>
                  {deal.negotiatedPrice < deal.listPrice && (
                    <span className="mr-2 text-xs line-through text-stone-400">
                      {gbp(deal.listPrice)}
                    </span>
                  )}
                  <span className="text-xl font-semibold tabular-nums text-indigo-950">
                    {gbp(deal.negotiatedPrice)}
                  </span>
                </span>
              </div>
              {deal.perkLabel && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  🎁 {deal.perkLabel}
                </p>
              )}
              {deal.concessions.length > 0 && (
                <ul className="space-y-1 text-xs text-stone-600">
                  {deal.concessions.map((c) => (
                    <li key={c}>↔ {c}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                disabled={!canApply || !deal}
                onClick={applyDeal}
                className="mt-2 w-full rounded-full bg-indigo-950 py-2.5 text-sm font-semibold text-amber-50 hover:bg-indigo-900 disabled:opacity-40"
              >
                Apply deal → checkout
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-500">
              Deal card fills as you negotiate.
            </p>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
            Demo script: Start → “Too pricey — knock £10 off” → optional “Better
            free perk?” → Accept / Apply deal → checkout as Sam → Merchant.
          </p>
        </aside>
      </div>
    </section>
  );
}
