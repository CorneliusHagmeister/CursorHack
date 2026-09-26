"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { gbp } from "@/lib/format";
import type { ExtraId, Negotiation, ProductPolicy, TermId } from "@/lib/negotiation/types";

type Item = {
  product: {
    id: string;
    brand: string;
    name: string;
    price: number;
    image: string;
    condition: string;
    waist: number;
    length: number;
  };
  policy: ProductPolicy;
  defaults: ProductPolicy;
  perks: { productId: string; brand: string; name: string; listPrice: number; image: string }[];
};

type Summary = {
  listPrice: number;
  firstPosition: number;
  walkAway: number;
  concessionPath: number[];
  bestPriceWithAllTerms: number;
  bundle: { perk: { brand: string; name: string }; price: number; dealValue: number } | null;
};

type SimLine = { role: "buyer" | "merchant"; text: string; decision?: string };

const PRIORITIES: { id: ProductPolicy["priority"]; label: string; hint: string }[] = [
  { id: "hold", label: "Hold", hint: "Never below target" },
  { id: "normal", label: "Normal", hint: "Target, then walk-away under pressure" },
  { id: "clear", label: "Clear", hint: "Start lower, push bundles" },
];
const RISKS: ProductPolicy["returnRisk"][] = ["low", "medium", "high"];

const inputCls =
  "w-20 rounded-lg border border-stone-300 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-indigo-900" : "bg-stone-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-stone-100 p-1" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <label
          key={o.id}
          className={`cursor-pointer rounded-full px-3 py-1 text-sm ${
            value === o.id ? "bg-white font-medium text-indigo-950 shadow-sm" : "text-stone-600"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.id}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Money({
  value,
  onChange,
  label,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  max?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-stone-500">
      £
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        aria-label={label}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputCls}
      />
    </span>
  );
}

export function DealSettings({
  items,
  termCatalog,
  extraCatalog,
}: {
  items: Item[];
  termCatalog: { id: TermId; label: string }[];
  extraCatalog: { id: ExtraId; label: string }[];
}) {
  const [selectedId, setSelectedId] = useState(items[0]?.product.id ?? "");
  const [saved, setSaved] = useState<Record<string, ProductPolicy>>(() =>
    Object.fromEntries(items.map((i) => [i.product.id, i.policy]))
  );
  const [drafts, setDrafts] = useState<Record<string, ProductPolicy>>(saved);
  const [showWalkAway, setShowWalkAway] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Simulator
  const [simNeg, setSimNeg] = useState<Negotiation | null>(null);
  const [simLog, setSimLog] = useState<SimLine[]>([]);
  const [simCounter, setSimCounter] = useState("");
  const [simTerms, setSimTerms] = useState<TermId[]>([]);
  const [simBundle, setSimBundle] = useState(false);
  const [simAi, setSimAi] = useState(false);
  const [simBusy, setSimBusy] = useState(false);

  const item = items.find((i) => i.product.id === selectedId) ?? items[0];
  const policy = drafts[item.product.id];
  const dirty = JSON.stringify(policy) !== JSON.stringify(saved[item.product.id]);
  const list = item.product.price;

  const update = (patch: Partial<ProductPolicy>) =>
    setDrafts((d) => ({ ...d, [item.product.id]: { ...d[item.product.id], ...patch } }));

  // Live preview of what the draft means, via the real engine (debounced)
  const draftKey = useMemo(() => JSON.stringify(policy), [policy]);
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch("/api/merchant/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.product.id, policy: JSON.parse(draftKey) }),
      });
      if (res.ok) setSummary((await res.json()).summary);
    }, 250);
    return () => clearTimeout(t);
  }, [draftKey, item.product.id]);

  function select(id: string) {
    setSelectedId(id);
    setShowWalkAway(false);
    setStatus(null);
    setSimNeg(null);
    setSimLog([]);
  }

  async function save() {
    setStatus("Saving…");
    const res = await fetch(`/api/merchant/policies/${item.product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy }),
    });
    const data = await res.json();
    if (!res.ok) return setStatus(data.error ?? "Could not save");
    setSaved((s) => ({ ...s, [item.product.id]: data.policy }));
    setDrafts((d) => ({ ...d, [item.product.id]: data.policy }));
    setStatus("Saved. New negotiations use these settings.");
  }

  async function resetToDefaults() {
    const res = await fetch(`/api/merchant/policies/${item.product.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setStatus(data.error ?? "Could not reset");
    setSaved((s) => ({ ...s, [item.product.id]: data.policy }));
    setDrafts((d) => ({ ...d, [item.product.id]: data.policy }));
    setStatus("Back to default settings.");
  }

  async function simulate(turn?: Record<string, unknown>) {
    setSimBusy(true);
    try {
      const res = await fetch("/api/merchant/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.product.id,
          policy,
          negotiation: turn ? simNeg : null,
          turn: turn ?? null,
          voice: simAi ? "llm" : "template",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Simulation failed");
      setSimNeg(data.negotiation);
      setSummary(data.summary);
      setSimLog((log) => [
        ...(turn ? log : []),
        ...(turn ? [{ role: "buyer" as const, text: String(turn.message) }] : []),
        { role: "merchant", text: data.reply, decision: data.decision },
      ]);
    } catch (e) {
      setSimLog((log) => [...log, { role: "merchant", text: e instanceof Error ? e.message : "Simulation failed" }]);
    } finally {
      setSimBusy(false);
    }
  }

  function sendSim() {
    const counter = Number(simCounter);
    const parts = [
      counter > 0 ? `Would you do £${counter}?` : "What can you do on price?",
      simTerms.length ? `We can do ${simTerms.map((t) => termCatalog.find((c) => c.id === t)?.label.toLowerCase()).join(", ")}.` : "",
      simBundle ? "Including the free pair." : "",
    ];
    void simulate({
      message: parts.filter(Boolean).join(" "),
      ...(counter > 0 ? { counterOffer: counter } : {}),
      ...(simTerms.length ? { offerTerms: simTerms } : {}),
      includePerk: simBundle,
    });
  }

  const walkAwayPct = Math.round((1 - policy.floorPrice / list) * 100);
  const targetPct = Math.round((1 - policy.targetPrice / list) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold text-indigo-950">Deal settings</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500">
        What the deal desk can offer on each pair. Buyers and their agents never see targets or walk-away prices.
      </p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ul className="max-h-72 space-y-1 overflow-y-auto lg:max-h-none" aria-label="Products">
          {items.map((i) => {
            const p = drafts[i.product.id];
            const active = i.product.id === item.product.id;
            const changed = JSON.stringify(p) !== JSON.stringify(saved[i.product.id]);
            return (
              <li key={i.product.id}>
                <button
                  type="button"
                  onClick={() => select(i.product.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left ${
                    active ? "bg-indigo-50" : "hover:bg-stone-100"
                  }`}
                >
                  <Image src={i.product.image} alt="" width={32} height={40} className="h-10 w-8 rounded-md object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-indigo-950">
                      {i.product.brand} {i.product.name}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {gbp(i.product.price)} · {p.negotiable ? PRIORITIES.find((x) => x.id === p.priority)?.label : "Fixed price"}
                      {changed && " · unsaved"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Image
                src={item.product.image}
                alt=""
                width={48}
                height={60}
                className="h-15 w-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-indigo-950">
                  {item.product.brand} {item.product.name}
                </h2>
                <p className="text-sm text-stone-500">
                  List {gbp(list)} · W{item.product.waist} L{item.product.length} · {item.product.condition}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                Negotiable
                <Switch checked={policy.negotiable} onChange={(v) => update({ negotiable: v })} label="Negotiable" />
              </label>
            </div>

            {/* What the settings mean in practice */}
            {summary && (
              <div className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
                {policy.negotiable ? (
                  <p>
                    Opens at <strong className="tabular-nums">{gbp(summary.listPrice)}</strong>. Under pressure it steps{" "}
                    <span className="tabular-nums">
                      {summary.concessionPath.map((p, i) => (
                        <span key={i}>
                          {i > 0 && " → "}
                          {showWalkAway || i === 0 ? gbp(p) : "••"}
                        </span>
                      ))}
                    </span>
                    , and only ever for commitments.
                  </p>
                ) : (
                  <p>Price is fixed at {gbp(list)}. The deal desk can still add value.</p>
                )}
                {summary.bundle && (
                  <p className="mt-1">
                    Lead deal: {gbp(summary.bundle.price)} with the {summary.bundle.perk.brand} {summary.bundle.perk.name} free
                    {" "}and extras, worth {gbp(summary.bundle.dealValue)} to the buyer.
                  </p>
                )}
              </div>
            )}

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-indigo-950">Price</legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-stone-700">Target</p>
                  <p className="text-xs text-stone-500">Where we want deals to land</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Money
                      label="Target price"
                      value={policy.targetPrice}
                      max={list}
                      onChange={(v) => update({ targetPrice: v })}
                    />
                    <span className="text-xs text-stone-500">{targetPct}% below list</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-stone-700">Walk-away</p>
                  <p className="text-xs text-stone-500">Only reached after sustained pressure</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {showWalkAway ? (
                      <>
                        <Money
                          label="Walk-away price"
                          value={policy.floorPrice}
                          max={policy.targetPrice}
                          onChange={(v) => update({ floorPrice: v })}
                        />
                        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                          or
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={90}
                            aria-label="Walk-away as percent below list"
                            value={walkAwayPct}
                            onChange={(e) => update({ floorPrice: Math.round(list * (1 - Number(e.target.value) / 100)) })}
                            className="w-14 rounded-lg border border-stone-300 bg-white px-2 py-1 text-right text-sm tabular-nums"
                          />
                          % below list
                        </span>
                      </>
                    ) : (
                      <span className="rounded-lg bg-stone-100 px-3 py-1 text-sm tracking-widest text-stone-500">••••</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowWalkAway((v) => !v)}
                      className="text-xs text-indigo-800 hover:underline"
                    >
                      {showWalkAway ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-indigo-950">Selling priority</legend>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Segmented
                  name="Selling priority"
                  value={policy.priority}
                  options={PRIORITIES}
                  onChange={(v) => update({ priority: v })}
                />
                <span className="text-xs text-stone-500">{PRIORITIES.find((p) => p.id === policy.priority)?.hint}</span>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
                Clear by
                <input
                  type="date"
                  value={policy.clearBy ?? ""}
                  onChange={(e) => update({ clearBy: e.target.value || null })}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm"
                />
              </label>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-indigo-950">Risk</legend>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-sm text-stone-700">Return risk</span>
                <Segmented
                  name="Return risk"
                  value={policy.returnRisk}
                  options={RISKS.map((r) => ({ id: r, label: r[0].toUpperCase() + r.slice(1) }))}
                  onChange={(v) => update({ returnRisk: v })}
                />
                <span className="text-xs text-stone-500">Higher risk makes final sale worth more</span>
              </div>
              <label className="mt-3 flex items-center gap-3 text-sm text-stone-700">
                <Switch checked={policy.highValue} onChange={(v) => update({ highValue: v })} label="High value" />
                High value: no free pairs or extras
              </label>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-indigo-950">Willing to compromise on</legend>

              <p className="mt-3 text-sm text-stone-700">Commitments we trade price for</p>
              <ul className="mt-2 space-y-2">
                {termCatalog.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-stone-700">
                      <input
                        type="checkbox"
                        checked={policy.terms[t.id].enabled}
                        onChange={(e) =>
                          update({ terms: { ...policy.terms, [t.id]: { ...policy.terms[t.id], enabled: e.target.checked } } })
                        }
                        className="h-4 w-4 accent-indigo-900"
                      />
                      {t.label}
                    </label>
                    <span className="flex items-center gap-2 text-xs text-stone-500">
                      worth
                      <Money
                        label={`${t.label} worth`}
                        value={policy.terms[t.id].discount}
                        max={list}
                        onChange={(v) =>
                          update({ terms: { ...policy.terms, [t.id]: { ...policy.terms[t.id], discount: v } } })
                        }
                      />
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-sm text-stone-700">Value we can add</p>
              <ul className="mt-2 space-y-2">
                {extraCatalog.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-stone-700">
                      <input
                        type="checkbox"
                        checked={policy.extras[x.id].enabled}
                        onChange={(e) =>
                          update({ extras: { ...policy.extras, [x.id]: { ...policy.extras[x.id], enabled: e.target.checked } } })
                        }
                        className="h-4 w-4 accent-indigo-900"
                      />
                      {x.label}
                    </label>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      costs us
                      <Money
                        label={`${x.label} cost`}
                        value={policy.extras[x.id].cost}
                        onChange={(v) => update({ extras: { ...policy.extras, [x.id]: { ...policy.extras[x.id], cost: v } } })}
                      />
                      worth to buyer
                      <Money
                        label={`${x.label} value`}
                        value={policy.extras[x.id].value}
                        onChange={(v) => update({ extras: { ...policy.extras, [x.id]: { ...policy.extras[x.id], value: v } } })}
                      />
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-sm text-stone-700">Free pairs to bundle (Pair &amp; Perk)</p>
                <Switch checked={policy.perkEnabled} onChange={(v) => update({ perkEnabled: v })} label="Pair & Perk bundles" />
              </div>
              {item.perks.length === 0 ? (
                <p className="mt-2 text-xs text-stone-500">No cheaper pairs within 4 waist sizes to bundle.</p>
              ) : (
                <ul className={`mt-2 space-y-2 ${policy.perkEnabled ? "" : "opacity-50"}`}>
                  {item.perks.map((p) => {
                    const allowed = policy.perkIds === null || policy.perkIds.includes(p.productId);
                    const pushed = policy.pushPerkIds.includes(p.productId);
                    return (
                      <li key={p.productId} className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm text-stone-700">
                          <input
                            type="checkbox"
                            disabled={!policy.perkEnabled}
                            checked={allowed}
                            onChange={(e) => {
                              const current = policy.perkIds ?? item.perks.map((x) => x.productId);
                              update({
                                perkIds: e.target.checked
                                  ? [...current, p.productId]
                                  : current.filter((id) => id !== p.productId),
                              });
                            }}
                            className="h-4 w-4 accent-indigo-900"
                          />
                          <Image src={p.image} alt="" width={24} height={30} className="h-8 w-6 rounded object-cover" />
                          {p.brand} {p.name} <span className="text-stone-500">{gbp(p.listPrice)}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-stone-500">
                          <input
                            type="checkbox"
                            disabled={!policy.perkEnabled || !allowed}
                            checked={pushed}
                            onChange={(e) =>
                              update({
                                pushPerkIds: e.target.checked
                                  ? [...policy.pushPerkIds, p.productId]
                                  : policy.pushPerkIds.filter((id) => id !== p.productId),
                              })
                            }
                            className="h-4 w-4 accent-indigo-900"
                          />
                          Push first
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-indigo-950">Voice notes</legend>
              <label className="mt-3 block text-sm text-stone-700">
                Selling points
                <textarea
                  value={policy.sellingPoints}
                  onChange={(e) => update({ sellingPoints: e.target.value })}
                  rows={2}
                  placeholder="e.g. Rare W30 in raw A.P.C., unworn, stiff hand"
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="mt-3 block text-sm text-stone-700">
                Never say
                <textarea
                  value={policy.avoidSaying}
                  onChange={(e) => update({ avoidSaying: e.target.value })}
                  rows={2}
                  placeholder="e.g. Don't mention the small mark on the back pocket unless asked"
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </fieldset>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty}
                className="rounded-full bg-indigo-950 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-indigo-900 disabled:opacity-40"
              >
                Save settings
              </button>
              <button
                type="button"
                onClick={() => void resetToDefaults()}
                className="rounded-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
              >
                Reset to defaults
              </button>
              {dirty && (
                <button
                  type="button"
                  onClick={() => setDrafts((d) => ({ ...d, [item.product.id]: saved[item.product.id] }))}
                  className="rounded-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
                >
                  Discard changes
                </button>
              )}
              {status && <p className="text-sm text-stone-500">{status}</p>}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-indigo-950">Try it as a buyer</h2>
            <p className="mt-1 text-sm text-stone-500">Runs the real deal desk against these settings, saved or not.</p>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="text-sm text-stone-700">
                Buyer offers
                <span className="mt-1 flex items-center gap-1 text-stone-500">
                  £
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={simCounter}
                    onChange={(e) => setSimCounter(e.target.value)}
                    placeholder={String(Math.round(list * 0.7))}
                    className={inputCls}
                  />
                </span>
              </label>
              <fieldset className="text-sm text-stone-700">
                <legend>Buyer commits to</legend>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {termCatalog
                    .filter((t) => policy.terms[t.id].enabled)
                    .map((t) => (
                      <label key={t.id} className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={simTerms.includes(t.id)}
                          onChange={(e) =>
                            setSimTerms((s) => (e.target.checked ? [...s, t.id] : s.filter((x) => x !== t.id)))
                          }
                          className="h-3.5 w-3.5 accent-indigo-900"
                        />
                        {t.label}
                      </label>
                    ))}
                </div>
              </fieldset>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <Switch checked={simBundle} onChange={setSimBundle} label="Ask for the bundle" />
                Ask for the bundle
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <Switch checked={simAi} onChange={setSimAi} label="AI voice" />
                AI voice
              </label>
              <button
                type="button"
                disabled={simBusy}
                onClick={() => (simNeg ? sendSim() : void simulate())}
                className="rounded-full bg-indigo-950 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-indigo-900 disabled:opacity-50"
              >
                {simNeg ? "Send offer" : "Start"}
              </button>
              {simNeg && (
                <button
                  type="button"
                  onClick={() => {
                    setSimNeg(null);
                    setSimLog([]);
                  }}
                  className="rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
                >
                  Start over
                </button>
              )}
            </div>

            {simLog.length > 0 && (
              <ol className="mt-5 space-y-3">
                {simLog.map((l, i) => (
                  <li key={i} className={`flex ${l.role === "buyer" ? "justify-end" : "justify-start"}`}>
                    <p
                      className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm ${
                        l.role === "buyer" ? "bg-indigo-950 text-amber-50" : "bg-white text-stone-800 shadow-sm"
                      }`}
                    >
                      {l.decision && <span className="mr-2 text-xs text-stone-500">[{l.decision}]</span>}
                      {l.text}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
