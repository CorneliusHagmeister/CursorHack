"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { gbp } from "@/lib/format";

function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const primaryId = params.get("primary") ?? "";
  const perkId = params.get("perk");

  const primary = useMemo(
    () => PRODUCTS.find((p) => p.id === primaryId),
    [primaryId]
  );
  const perk = useMemo(
    () => (perkId ? PRODUCTS.find((p) => p.id === perkId) : undefined),
    [perkId]
  );

  const [buyerName, setBuyerName] = useState("Alex Mercer");
  const [buyerEmail, setBuyerEmail] = useState("alex@example.com");
  const [shippingCity, setShippingCity] = useState("London");
  const [note, setNote] = useState("Leave with neighbour if out");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!primary) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-stone-600">No primary pair selected.</p>
        <Link href="/" className="mt-4 inline-block text-indigo-800 underline">
          Back to shop
        </Link>
      </div>
    );
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryId: primary!.id,
          perkId: perk?.id ?? null,
          buyerName,
          buyerEmail,
          shippingCity,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      router.push(`/order/${data.order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed");
      setBusy(false);
    }
  }

  const perkSavings = perk?.price ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-indigo-950">Checkout</h1>
      <p className="mt-1 text-sm text-stone-600">
        Pair &amp; Perk · pay full price on primary
        {perk ? ", complementary perk free" : ""}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <label className="block text-sm">
            <span className="text-stone-600">Name</span>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone-600">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone-600">Shipping city</span>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone-600">Note</span>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Order summary
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex justify-between gap-2">
              <span>
                <span className="font-medium text-indigo-950">
                  {primary.brand} {primary.name}
                </span>
                <span className="block text-xs text-stone-500">Primary</span>
              </span>
              <span className="tabular-nums">{gbp(primary.price)}</span>
            </li>
            {perk && (
              <li className="flex justify-between gap-2 rounded-lg bg-emerald-50 px-2 py-1.5">
                <span>
                  <span className="font-medium text-indigo-950">
                    {perk.brand} {perk.name}
                  </span>
                  <span className="block text-xs text-emerald-700">
                    Pair &amp; Perk · free
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-xs line-through text-stone-400">
                    {gbp(perk.price)}
                  </span>
                  <span className="font-medium text-emerald-700">£0</span>
                </span>
              </li>
            )}
          </ul>
          <div className="mt-4 space-y-1 border-t border-stone-100 pt-4 text-sm">
            {perkSavings > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Perk savings</span>
                <span>−{gbp(perkSavings)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-indigo-950">
              <span>Total</span>
              <span className="tabular-nums">{gbp(primary.price)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="button"
            disabled={busy || !buyerName || !buyerEmail || !shippingCity}
            onClick={() => void placeOrder()}
            className="mt-5 w-full rounded-full bg-indigo-950 py-2.5 text-sm font-semibold text-amber-50 hover:bg-indigo-900 disabled:opacity-50"
          >
            {busy ? "Placing order…" : "Confirm Pair & Perk order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-stone-500">Loading…</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
