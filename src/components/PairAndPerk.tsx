"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { gbp, productAlt } from "@/lib/format";

export function PairAndPerk({
  primary,
  perkOptions,
  shopperWaist,
}: {
  primary: Product;
  perkOptions: Product[];
  shopperWaist?: number;
}) {
  const router = useRouter();
  const [perkId, setPerkId] = useState<string | null>(
    perkOptions[0]?.id ?? null
  );
  const selected = useMemo(
    () => perkOptions.find((p) => p.id === perkId) ?? null,
    [perkId, perkOptions]
  );

  function continueCheckout() {
    const params = new URLSearchParams({
      primary: primary.id,
    });
    if (perkId) params.set("perk", perkId);
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <section
      id="new-ways"
      className="scroll-mt-24 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-5 text-amber-50 shadow-lg sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Bundle: get a second pair free
          </h2>
          <p className="mt-2 max-w-xl text-sm text-indigo-100/90">
            Pay full price for this pair and unlock one complementary denim
            piece <strong className="text-amber-100">free</strong>.
          </p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-right text-sm backdrop-blur">
          <p className="text-indigo-200">You pay</p>
          <p className="text-2xl font-semibold tabular-nums">{gbp(primary.price)}</p>
          {selected && (
            <p className="text-xs text-emerald-300">
              + {gbp(selected.price)} perk free
            </p>
          )}
        </div>
      </div>

      {perkOptions.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm text-indigo-100">
          No complementary perk pairs match this waist right now. You can still
          checkout this pair alone.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {perkOptions.map((p) => {
            const active = p.id === perkId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerkId(p.id)}
                className={`flex gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-amber-300 bg-white/15 ring-2 ring-amber-300/60"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <Image
                  src={p.image}
                  alt={productAlt(p)}
                  width={72}
                  height={90}
                  className="h-[4.5rem] w-14 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm text-indigo-200">Free perk</span>
                    <span className="text-xs line-through opacity-70">
                      {gbp(p.price)}
                    </span>
                  </span>
                  <span className="mt-1 block font-medium">
                    {p.brand} {p.name}
                  </span>
                  <span className="block text-xs text-indigo-200">
                    W{p.waist} L{p.length} · {p.condition} · {p.wash}
                    {shopperWaist != null && p.waist !== shopperWaist
                      ? ` · you wear W${shopperWaist}`
                      : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={continueCheckout}
          className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-indigo-950 hover:bg-amber-200"
        >
          Continue to checkout
          {selected ? ` · + free ${selected.brand}` : ""}
        </button>
        <button
          type="button"
          onClick={() => {
            setPerkId(null);
            const params = new URLSearchParams({ primary: primary.id });
            router.push(`/checkout?${params.toString()}`);
          }}
          className="rounded-full border border-white/25 px-5 py-2.5 text-sm text-indigo-100 hover:bg-white/10"
        >
          Pay full price only
        </button>
      </div>
    </section>
  );
}
