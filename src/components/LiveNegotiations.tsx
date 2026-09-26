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
  store_credit: "store credit instead of refund",
  standard_shipping: "standard shipping",
  fit_review: "fit review",
  collect_london: "collect in London",
};

const EXTRA_LABELS: Record<string, string> = {
  free_hemming: "free hemming",
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
  opening: { text: "opened", style: "text-stone-500" },
  conditional: { text: "asked for terms", style: "text-stitch-ink" },
  quote: { text: "quoted", style: "text-rinse" },
  counter: { text: "proposed a deal", style: "text-rinse" },
  accept_offer: { text: "shook on it", style: "text-berry" },
  accept_counter: { text: "shook on it", style: "text-berry" },
};

/** Every price each side put down, in order, plus where it ended */
function priceTrail(n: LiveNegotiation) {
  const bids: { price: number; at: string }[] = [];
  const asks: { price: number; at: string }[] = [];
  for (const t of n.transcript) {
    if (t.role === "buyer" && t.counterOffer != null) bids.push({ price: t.counterOffer, at: t.at });
    if (t.role === "merchant") {
      const price = t.offer?.price ?? t.counterOffer;
      if (price != null) asks.push({ price, at: t.at });
    }
  }
  return { bids, asks, lastBid: bids.at(-1)?.price, lastAsk: asks.at(-1)?.price, deal: n.agreed?.price };
}

/** One line on where a negotiation stands, for the rail and the tape caption */
function standing(n: LiveNegotiation) {
  const { lastBid, lastAsk, deal } = priceTrail(n);
  if (n.status === "purchased" && deal != null) return `Sold at ${gbp(deal)}`;
  if (deal != null) return `Agreed at ${gbp(deal)}, awaiting payment`;
  if (lastBid != null && lastAsk != null) {
    const gap = lastAsk - lastBid;
    return gap > 0 ? `${gbp(gap)} apart` : "Prices have met";
  }
  if (lastAsk != null) return `Finn asking ${gbp(lastAsk)}`;
  if (lastBid != null) return `Buyer bid ${gbp(lastBid)}`;
  return "Just started";
}

const STATUS_DOT: Record<LiveNegotiation["status"], string> = {
  open: "bg-stitch",
  agreed: "bg-berry",
  purchased: "bg-berry ring-2 ring-berry/25",
};

function tickStep(range: number) {
  if (range <= 30) return 5;
  if (range <= 80) return 10;
  if (range <= 200) return 25;
  return 50;
}

/**
 * The price tape: a stitched measuring tape from the lowest price anyone named up
 * to list. Finn's asks hang from the top edge, the buyer's bids sit on the bottom,
 * and an agreed price drops straight through.
 */
function PriceTape({ n }: { n: LiveNegotiation }) {
  const { bids, asks, lastBid, lastAsk, deal } = priceTrail(n);
  const list = n.product.listPrice;
  const all = [list, ...bids.map((b) => b.price), ...asks.map((a) => a.price), ...(deal != null ? [deal] : [])];
  const low = Math.min(...all);
  const step = tickStep(Math.max(list - low, 10));
  const min = Math.max(0, Math.floor((low - step / 2) / step) * step);
  const max = list;
  const pos = (p: number) => `${((p - min) / (max - min || 1)) * 100}%`;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);

  const caption =
    deal != null
      ? `${n.status === "purchased" ? "Sold" : "Agreed"} at ${gbp(deal)}, ${gbp(list - deal)} under list.`
      : lastBid != null && lastAsk != null
        ? `Finn is at ${gbp(lastAsk)}, the buyer at ${gbp(lastBid)}. ${
            lastAsk > lastBid ? `${gbp(lastAsk - lastBid)} apart.` : "Prices have met."
          }`
        : lastAsk != null
          ? `Finn is asking ${gbp(lastAsk)}. No bid from the buyer yet.`
          : "No prices on the table yet.";

  return (
    <figure className="px-4 pb-5 pt-2 sm:px-6" aria-label="Price tape">
      <div className="relative mx-6 h-36 sm:mx-10">
        {/* Finn's asks, top edge */}
        {asks.map((a, i) => {
          const latest = i === asks.length - 1 && deal == null;
          return (
            <div
              key={`ask-${a.at}-${i}`}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center motion-safe:transition-[left] motion-safe:duration-500"
              style={{ left: pos(a.price) }}
              title={`Finn asked ${gbp(a.price)} at ${time(a.at)}`}
            >
              <span className={`font-slab text-lg font-semibold leading-none text-rinse tabular-nums ${latest ? "" : "invisible"}`}>
                {gbp(a.price)}
              </span>
              <span className={`mt-1 text-xs text-stone-500 ${latest ? "" : "invisible"}`}>Finn</span>
              <span
                className={`mt-1 h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent ${
                  latest ? "border-t-rinse" : "border-t-rinse/25"
                }`}
              />
            </div>
          );
        })}

        {/* The tape */}
        <div className="absolute inset-x-0 top-[3.25rem] h-10 rounded-[3px] bg-chambray">
          <div className="absolute inset-x-1 top-1 border-t-2 border-dashed border-stitch/70" />
          <div className="absolute inset-x-1 bottom-1 border-t-2 border-dashed border-stitch/70" />
          {ticks.map((v) => (
            <div key={v} className="absolute top-2.5 -translate-x-1/2" style={{ left: pos(v) }}>
              <div className="mx-auto h-2 w-px bg-rinse/40" />
              <p className="mt-0.5 text-[10px] leading-none text-rinse/60 tabular-nums">{v}</p>
            </div>
          ))}
          {lastBid != null && lastAsk != null && lastAsk > lastBid && deal == null && (
            <div
              className="absolute inset-y-2.5 bg-rinse/10 motion-safe:transition-all motion-safe:duration-500"
              style={{ left: pos(lastBid), right: `calc(100% - ${pos(lastAsk)})` }}
              aria-hidden
            />
          )}
          {deal != null && (
            <div
              className="absolute -inset-y-3 w-[3px] -translate-x-1/2 rounded-full bg-berry"
              style={{ left: pos(deal) }}
              aria-hidden
            />
          )}
        </div>
        <p className="absolute right-0 top-[5.9rem] translate-x-1/2 text-xs text-stone-500">List</p>

        {/* Buyer's bids, bottom edge */}
        {bids.map((b, i) => {
          const latest = i === bids.length - 1 && deal == null;
          return (
            <div
              key={`bid-${b.at}-${i}`}
              className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center motion-safe:transition-[left] motion-safe:duration-500"
              style={{ left: pos(b.price) }}
              title={`Buyer bid ${gbp(b.price)} at ${time(b.at)}`}
            >
              <span
                className={`mb-1 h-0 w-0 border-x-[7px] border-b-[9px] border-x-transparent ${
                  latest ? "border-b-stitch" : "border-b-stitch/30"
                }`}
              />
              <span className={`text-xs text-stone-500 ${latest ? "" : "invisible"}`}>Buyer</span>
              <span
                className={`mt-1 font-slab text-lg font-semibold leading-none text-stitch-ink tabular-nums ${
                  latest ? "" : "invisible"
                }`}
              >
                {gbp(b.price)}
              </span>
            </div>
          );
        })}

        {deal != null && (
          <div
            className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-center"
            style={{ left: pos(deal) }}
          >
            <span className="font-slab text-lg font-bold leading-none text-berry tabular-nums">
              Deal {gbp(deal)}
            </span>
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-center text-sm text-stone-600">{caption}</figcaption>
    </figure>
  );
}

function OfferCard({ offer, product }: { offer: Offer; product: LiveNegotiation["product"] }) {
  const below = product.listPrice - offer.price;
  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg border border-chambray bg-white px-3 py-2.5">
      <div className="flex shrink-0 items-center">
        {product.image && (
          <Image src={product.image} alt="" width={36} height={45} className="h-11 w-9 rounded object-cover" />
        )}
        {offer.perk?.image && (
          <Image
            src={offer.perk.image}
            alt=""
            width={36}
            height={45}
            className="-ml-2 h-11 w-9 rounded object-cover ring-2 ring-white"
          />
        )}
      </div>
      <div className="min-w-0 text-sm">
        <p className="text-rinse">
          <span className="font-slab text-lg font-semibold tabular-nums">{gbp(offer.price)}</span>
          {below > 0 && <span className="ml-1.5 text-stone-500 line-through tabular-nums">{gbp(product.listPrice)}</span>}
          {offer.perk && (
            <span className="ml-1.5">
              + {offer.perk.brand} {offer.perk.name} free{" "}
              <span className="text-stone-500">(worth {gbp(offer.perk.listPrice)})</span>
            </span>
          )}
        </p>
        {offer.extras?.length ? (
          <p className="mt-0.5 text-xs text-stone-600">
            Finn adds {offer.extras.map((e) => EXTRA_LABELS[e] ?? e).join(" and ")}
            {(offer.dealValue ?? 0) > 0 && <>, {gbp(offer.dealValue!)} of value</>}
          </p>
        ) : null}
        {offer.terms.length > 0 && (
          <p className="mt-0.5 text-xs text-stone-600">Buyer accepts {termsText(offer.terms).replaceAll(" + ", " and ")}</p>
        )}
      </div>
    </div>
  );
}

function ChatLine({ entry, product }: { entry: Entry; product: LiveNegotiation["product"] }) {
  const buyer = entry.role === "buyer";
  const label = entry.decision ? DECISION_LABEL[entry.decision] : undefined;
  const bid = [
    entry.counterOffer != null ? `bids ${gbp(entry.counterOffer)}` : null,
    entry.offerTerms?.length ? `accepts ${termsText(entry.offerTerms).replaceAll(" + ", " and ")}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <li className={`flex ${buyer ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <p className={`mb-1 flex flex-wrap items-baseline gap-x-1.5 text-xs text-stone-500 ${buyer ? "justify-end" : ""}`}>
          <span className="font-medium text-stone-800">{buyer ? "Buyer agent" : "Finn"}</span>
          {label && <span className={label.style}>{label.text}</span>}
          {buyer && bid && <span className="text-stitch-ink">{bid}</span>}
          <time className="text-stone-400 tabular-nums" dateTime={entry.at}>
            {time(entry.at)}
          </time>
        </p>
        <p
          className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            buyer
              ? "rounded-tr-sm border border-stitch/40 bg-[#fbf4e6] text-stone-900"
              : "rounded-tl-sm bg-rinse text-white"
          }`}
        >
          {entry.text}
        </p>
        {!buyer && entry.offer && <OfferCard offer={entry.offer} product={product} />}
      </div>
    </li>
  );
}

function ChatEvent({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-xs text-berry">
      <span className="h-px flex-1 bg-berry/30" aria-hidden />
      <p className="max-w-[80%] break-words text-center">{children}</p>
      <span className="h-px flex-1 bg-berry/30" aria-hidden />
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
        ? "Live"
        : "Connecting…"
      : storageError
        ? `Refreshing every 2 seconds (Supabase unavailable: ${storageError})`
        : "Refreshing every 2 seconds";

  const open = items.filter((n) => n.status === "open").length;
  const closed = items.length - open;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-slab text-4xl font-bold text-rinse">Live negotiations</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                {storage === "supabase" && realtime && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    storage === "supabase" && realtime ? "bg-emerald-500" : "bg-stone-400"
                  }`}
                />
              </span>
              {liveLabel}
            </span>
            {items.length > 0 && (
              <span>
                {open} haggling, {closed} agreed
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void startSimulatedBuyer()}
          disabled={starting}
          className="rounded-full bg-rinse px-4 py-2 text-sm font-medium text-white hover:bg-rinse/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch disabled:opacity-50"
        >
          {starting ? "Sending a buyer…" : "Send a test buyer"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border-2 border-dashed border-stitch/50 px-6 py-10 text-center">
          <p className="font-slab text-xl font-semibold text-rinse">Nobody is haggling yet</p>
          <p className="mt-2 text-sm text-stone-600">
            Send a test buyer to watch Finn negotiate, or point ChatGPT at{" "}
            <code className="rounded bg-chambray px-1 text-rinse">/api/openapi.json</code>.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <ul
            className="max-h-64 min-w-0 divide-y divide-stone-200 overflow-y-auto border-y border-stone-200 lg:max-h-[48rem]"
            aria-label="Negotiations"
          >
            {items.map((n) => {
              const active = n.id === selected?.id;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full border-l-[3px] px-3 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stitch ${
                      active ? "border-rinse bg-chambray/60" : "border-transparent hover:bg-stone-100"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-rinse">{n.buyerName}</span>
                      <time className="shrink-0 text-xs text-stone-400 tabular-nums" dateTime={n.updatedAt}>
                        {time(n.updatedAt)}
                      </time>
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {n.product.brand} {n.product.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-stone-700">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[n.status]}`} aria-hidden />
                      {standing(n)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <section className="flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
                {selected.product.image && (
                  <Image
                    src={selected.product.image}
                    alt=""
                    width={40}
                    height={50}
                    className="h-12 w-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-rinse">
                    {selected.buyerName} on {selected.product.brand} {selected.product.name}
                  </h2>
                  <p className="text-sm text-stone-500">Listed at {gbp(selected.product.listPrice)}</p>
                </div>
                {selected.orderId && (
                  <Link href={`/order/${selected.orderId}`} className="text-sm text-berry underline-offset-2 hover:underline">
                    View order
                  </Link>
                )}
              </div>

              <PriceTape n={selected} />

              <ol
                className="max-h-[36rem] flex-1 space-y-4 overflow-y-auto border-t border-stone-200 bg-stone-50 px-3 py-5 sm:px-6"
                aria-live="polite"
              >
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
                      <p className="rounded-2xl rounded-tl-sm bg-rinse/10 px-3.5 py-2 text-sm text-rinse">
                        Finn is typing<span className="motion-safe:animate-pulse">…</span>
                      </p>
                    </li>
                  ) : null;
                })()}
                {selected.agreed && (
                  <ChatEvent>
                    Deal agreed at {time(selected.agreed.agreedAt)}: {describeOffer(selected.agreed)}
                  </ChatEvent>
                )}
                {selected.orderId && (
                  <ChatEvent>
                    Order placed,{" "}
                    <Link href={`/order/${selected.orderId}`} className="underline">
                      {selected.orderId}
                    </Link>
                  </ChatEvent>
                )}
                <li ref={chatEnd} aria-hidden />
              </ol>

              {selected.status === "open" && selected.offers.length > 0 && (
                <div className="border-t border-stone-200 px-4 py-4 text-sm sm:px-6">
                  <p className="text-stone-500">Offers the buyer can take now</p>
                  <ul className="mt-1.5 space-y-1 text-rinse">
                    {selected.offers.map((o) => (
                      <li key={o.offerId}>{describeOffer(o)}</li>
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
