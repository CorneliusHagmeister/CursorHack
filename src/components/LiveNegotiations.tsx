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
  perk: { brand: string; name: string; listPrice: number; image: string | null } | null;
  terms: string[];
  extras?: string[];
  dealValue?: number;
};

type Entry = {
  role: "buyer" | "merchant";
  text: string;
  counterOffer?: number;
  offerTerms?: string[];
  decision?: string;
  offer?: Offer | null;
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
  collect_london: "collect in London",
};

const EXTRA_LABELS: Record<string, string> = {
  free_hemming: "free hemming",
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
    o.extras?.length ? `+ ${o.extras.map((e) => EXTRA_LABELS[e] ?? e).join(" + ")}` : null,
    o.terms.length ? `for ${termsText(o.terms)}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/** What the pricing engine did on a merchant turn, in merchant language */
const DECISION_LABEL: Record<string, { text: string; style: string }> = {
  opening: { text: "Opened", style: "bg-stone-200 text-stone-700" },
  conditional: { text: "Asked for terms", style: "bg-amber-100 text-amber-900" },
  quote: { text: "Quoted", style: "bg-sky-100 text-sky-900" },
  counter: { text: "Proposed a deal", style: "bg-rose-100 text-rose-900" },
  accept_offer: { text: "Deal", style: "bg-emerald-100 text-emerald-900" },
  accept_counter: { text: "Deal", style: "bg-emerald-100 text-emerald-900" },
};

function OfferCard({ offer, product }: { offer: Offer; product: LiveNegotiation["product"] }) {
  const below = product.listPrice - offer.price;
  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5">
      <div className="flex shrink-0 items-center">
        {product.image && (
          <Image src={product.image} alt="" width={36} height={45} className="h-11 w-9 rounded-md object-cover" />
        )}
        {offer.perk?.image && (
          <Image
            src={offer.perk.image}
            alt=""
            width={36}
            height={45}
            className="-ml-2 h-11 w-9 rounded-md object-cover ring-2 ring-indigo-50"
          />
        )}
      </div>
      <div className="min-w-0 text-sm">
        <p className="text-indigo-950">
          <span className="text-base font-semibold tabular-nums">{gbp(offer.price)}</span>
          {below > 0 && <span className="ml-1.5 text-stone-500 line-through tabular-nums">{gbp(product.listPrice)}</span>}
          {offer.perk && (
            <span className="ml-1.5">
              + {offer.perk.brand} {offer.perk.name} free{" "}
              <span className="text-stone-500">(worth {gbp(offer.perk.listPrice)})</span>
            </span>
          )}
        </p>
        {(offer.extras?.length || (offer.dealValue ?? 0) > 0) && (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-stone-600">
            {offer.extras?.map((e) => (
              <span key={e} className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">
                {EXTRA_LABELS[e] ?? e}
              </span>
            ))}
            {(offer.dealValue ?? 0) > 0 && (
              <span className="text-emerald-800">{gbp(offer.dealValue!)} deal value</span>
            )}
          </p>
        )}
        {offer.terms.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-stone-600">
            Buyer gives
            {offer.terms.map((t) => (
              <span key={t} className="rounded-full bg-white px-2 py-0.5 text-indigo-900">
                {TERM_LABELS[t] ?? t}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

function ChatLine({ entry, product }: { entry: Entry; product: LiveNegotiation["product"] }) {
  const buyer = entry.role === "buyer";
  const label = entry.decision ? DECISION_LABEL[entry.decision] : undefined;
  return (
    <li className={`flex ${buyer ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <p className={`mb-1 flex items-center gap-2 text-xs text-stone-500 ${buyer ? "justify-end" : ""}`}>
          <span className="font-medium text-stone-700">{buyer ? "Buyer agent" : "Mo"}</span>
          {label && <span className={`rounded-full px-2 py-0.5 ${label.style}`}>{label.text}</span>}
          <span>{time(entry.at)}</span>
        </p>
        <p
          className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            buyer ? "rounded-tr-md bg-indigo-950 text-amber-50" : "rounded-tl-md bg-white text-stone-800 shadow-sm"
          }`}
        >
          {entry.text}
        </p>
        {buyer && (entry.counterOffer != null || entry.offerTerms?.length) ? (
          <p className="mt-1 flex flex-wrap justify-end gap-1 text-xs">
            {entry.counterOffer != null && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-900">
                Offers {gbp(entry.counterOffer)}
              </span>
            )}
            {entry.offerTerms?.map((t) => (
              <span key={t} className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-900">
                Gives {TERM_LABELS[t] ?? t}
              </span>
            ))}
          </p>
        ) : null}
        {!buyer && entry.offer && <OfferCard offer={entry.offer} product={product} />}
      </div>
    </li>
  );
}

function ChatEvent({ children, tone }: { children: React.ReactNode; tone: "deal" | "sale" }) {
  return (
    <li className="flex justify-center">
      <p
        className={`max-w-full break-words rounded-2xl px-3 py-1 text-center text-xs ${
          tone === "sale" ? "bg-emerald-100 text-emerald-900" : "bg-indigo-100 text-indigo-900"
        }`}
      >
        {children}
      </p>
    </li>
  );
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
  const chatEnd = useRef<HTMLLIElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

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
  }, [selected?.transcript.length, selected?.id, selected?.status]);

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
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <ul className="max-h-60 min-w-0 space-y-1 overflow-y-auto lg:max-h-none" aria-label="Negotiations">
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
            <section className="flex min-h-[28rem] min-w-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
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
                  <p className="text-sm text-stone-500">List {gbp(selected.product.listPrice)}</p>
                </div>
                {selected.orderId && (
                  <Link href={`/order/${selected.orderId}`} className="text-sm text-indigo-800 hover:underline">
                    View order
                  </Link>
                )}
              </div>

              <ol className="max-h-[36rem] flex-1 space-y-4 overflow-y-auto bg-stone-50 px-3 py-5 sm:px-5" aria-live="polite">
                {selected.transcript.map((t, i) => (
                  <ChatLine key={`${t.at}-${i}`} entry={t} product={selected.product} />
                ))}
                {(() => {
                  const last = selected.transcript[selected.transcript.length - 1];
                  const waiting =
                    last?.role === "buyer" &&
                    selected.status !== "purchased" &&
                    now - Date.parse(last.at) < 30_000;
                  return waiting ? (
                    <li className="flex justify-start">
                      <p className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2 text-sm text-stone-500 shadow-sm">
                        Mo is typing<span className="animate-pulse">…</span>
                      </p>
                    </li>
                  ) : null;
                })()}
                {selected.agreed && (
                  <ChatEvent tone="deal">
                    Deal agreed · {describeOffer(selected.agreed)} · {time(selected.agreed.agreedAt)}
                  </ChatEvent>
                )}
                {selected.orderId && (
                  <ChatEvent tone="sale">
                    Order placed ·{" "}
                    <Link href={`/order/${selected.orderId}`} className="underline">
                      {selected.orderId}
                    </Link>
                  </ChatEvent>
                )}
                <li ref={chatEnd} aria-hidden />
              </ol>

              {selected.status === "open" && selected.offers.length > 0 && (
                <div className="px-4 py-4 text-sm sm:px-5">
                  <p className="text-stone-500">On the table</p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {selected.offers.map((o) => (
                      <li key={o.offerId} className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                        {describeOffer(o)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
