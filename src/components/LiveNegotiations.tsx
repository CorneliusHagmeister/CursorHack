"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { gbp } from "@/lib/format";

type Offer = {
  offerId: string;
  kind: "cash" | "pair-and-perk";
  price: number;
  perk: { brand: string; name: string; listPrice: number } | null;
  terms: string[];
};

type Entry = {
  role: "buyer" | "merchant";
  text: string;
  counterOffer?: number;
  offerTerms?: string[];
  at: string;
};

type LiveNegotiation = {
  id: string;
  status: "open" | "agreed" | "purchased";
  buyerName: string;
  product: { id: string; brand: string; name: string; image: string | null; listPrice: number };
  offers: Offer[];
  agreed: (Offer & { agreedAt: string }) | null;
  orderId: string | null;
  transcript: Entry[];
  updatedAt: string;
};

const TERM_LABELS: Record<string, string> = {
  final_sale: "final sale",
  standard_shipping: "standard shipping",
  fit_review: "fit review",
};

const STATUS_STYLE: Record<LiveNegotiation["status"], string> = {
  open: "bg-amber-100 text-amber-900",
  agreed: "bg-indigo-100 text-indigo-900",
  purchased: "bg-emerald-100 text-emerald-900",
};

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function termsText(terms: string[]) {
  return terms.map((t) => TERM_LABELS[t] ?? t).join(" + ");
}

function describeOffer(o: Offer) {
  return [
    gbp(o.price),
    o.perk ? `with free ${o.perk.brand} ${o.perk.name}` : null,
    o.terms.length ? `for ${termsText(o.terms)}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Browser Supabase client from the public env vars, or null when not configured */
function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}

export function LiveNegotiations() {
  const [items, setItems] = useState<LiveNegotiation[]>([]);
  const [storage, setStorage] = useState<"supabase" | "memory" | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/negotiations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load negotiations");
      setItems(data.negotiations);
      setStorage(data.storage);
      setStorageError(data.storageError ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load negotiations");
    }
  }, []);

  // Realtime when the server stores to Supabase; otherwise (or as a backstop) poll
  useEffect(() => {
    const first = setTimeout(load, 0);
    const supabase = storage === "supabase" ? browserSupabase() : null;
    if (!supabase) {
      const poll = setInterval(load, 2000);
      return () => {
        clearTimeout(first);
        clearInterval(poll);
      };
    }
    const channel = supabase
      .channel("merchant-live-negotiations")
      .on("postgres_changes", { event: "*", schema: "public", table: "il_agent_negotiations" }, () => void load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "il_agent_negotiation_messages" }, () => void load())
      .subscribe((status) => setRealtime(status === "SUBSCRIBED"));
    const backstop = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(backstop);
      setRealtime(false);
      void supabase.removeChannel(channel);
    };
  }, [load, storage]);

  const selected = items.find((n) => n.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected?.transcript.length, selected?.id]);

  async function startSimulatedBuyer() {
    setStarting(true);
    try {
      const res = await fetch("/api/merchant/simulated-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start the simulated buyer");
      setSelectedId(data.negotiationId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the simulated buyer");
    } finally {
      setStarting(false);
    }
  }

  const liveLabel =
    storage === "supabase"
      ? realtime
        ? "Live from Supabase"
        : "Connecting to Supabase…"
      : storageError
        ? `Refreshing every 2 seconds (Supabase unavailable: ${storageError})`
        : "Refreshing every 2 seconds (Supabase not configured)";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-indigo-950">Live negotiations</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                storage === "supabase" && realtime ? "bg-emerald-500" : "bg-stone-400"
              }`}
              aria-hidden
            />
            {liveLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void startSimulatedBuyer()}
          disabled={starting}
          className="rounded-full bg-indigo-950 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-indigo-900 disabled:opacity-50"
        >
          {starting ? "Starting…" : "Run simulated buyer"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-stone-500">
          No agent negotiations yet. Run a simulated buyer, or point ChatGPT at{" "}
          <code className="rounded bg-stone-100 px-1">/api/openapi.json</code>.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <ul className="space-y-1" aria-label="Negotiations">
            {items.map((n) => {
              const active = n.id === selected?.id;
              const last = n.transcript[n.transcript.length - 1];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full rounded-xl px-3 py-2.5 text-left ${
                      active ? "bg-indigo-50" : "hover:bg-stone-100"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-indigo-950">{n.buyerName}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[n.status]}`}>
                        {n.status}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {n.product.brand} {n.product.name} · {time(n.updatedAt)}
                    </span>
                    {last && (
                      <span className="mt-1 block truncate text-xs text-stone-600">{last.text}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <section className="flex min-h-[32rem] flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4">
                {selected.product.image && (
                  <Image
                    src={selected.product.image}
                    alt=""
                    width={40}
                    height={50}
                    className="h-12 w-10 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-indigo-950">
                    {selected.buyerName} on {selected.product.brand} {selected.product.name}
                  </h2>
                  <p className="text-sm text-stone-500">
                    List {gbp(selected.product.listPrice)}
                    {selected.agreed && <> · agreed {describeOffer(selected.agreed)}</>}
                  </p>
                </div>
                {selected.orderId && (
                  <Link href={`/order/${selected.orderId}`} className="text-sm text-indigo-800 hover:underline">
                    View order
                  </Link>
                )}
              </div>

              <ol className="flex-1 space-y-3 overflow-y-auto bg-stone-50 px-5 py-4" aria-live="polite">
                {selected.transcript.map((t, i) => (
                  <li key={i} className={`flex ${t.role === "buyer" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      <p
                        className={`rounded-2xl px-3.5 py-2 text-sm ${
                          t.role === "buyer" ? "bg-indigo-950 text-amber-50" : "bg-white text-stone-800 shadow-sm"
                        }`}
                      >
                        {t.text}
                      </p>
                      <p className={`mt-1 text-xs text-stone-500 ${t.role === "buyer" ? "text-right" : ""}`}>
                        {t.role === "buyer" ? "Buyer agent" : "Mo (merchant)"} · {time(t.at)}
                        {t.counterOffer != null && <> · offered {gbp(t.counterOffer)}</>}
                        {t.offerTerms?.length ? <> · gives {termsText(t.offerTerms)}</> : null}
                      </p>
                    </div>
                  </li>
                ))}
                <div ref={chatEnd} />
              </ol>

              <div className="px-5 py-4 text-sm">
                {selected.status === "purchased" ? (
                  <p className="text-emerald-800">
                    Sold for {selected.agreed ? describeOffer(selected.agreed) : "the agreed price"}.
                  </p>
                ) : selected.status === "agreed" ? (
                  <p className="text-indigo-900">
                    Deal agreed at {selected.agreed ? describeOffer(selected.agreed) : ""}. Waiting for the buyer to pay.
                  </p>
                ) : (
                  <div>
                    <p className="text-stone-500">On the table</p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {selected.offers.map((o) => (
                        <li key={o.offerId} className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                          {describeOffer(o)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
