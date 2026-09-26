"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { gbp, productAlt } from "@/lib/format";
import { PRODUCTS } from "@/lib/products";

function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const primaryId = params.get("primary") ?? "";
  const perkId = params.get("perk");
  const negotiated = params.get("negotiated") === "1";
  const priceParam = params.get("price");
  const listParam = params.get("list");
  const summary = params.get("summary") ?? "";
  const concessions = params.get("concessions") ?? "";

  const primary = useMemo(
    () => PRODUCTS.find((p) => p.id === primaryId),
    [primaryId]
  );
  const perk = useMemo(
    () => (perkId ? PRODUCTS.find((p) => p.id === perkId) : undefined),
    [perkId]
  );

  const listPrice = listParam ? Number(listParam) : primary?.price ?? 0;
  const payPrice = priceParam ? Number(priceParam) : primary?.price ?? 0;

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [note, setNote] = useState(
    negotiated ? "Negotiated deal" : "Leave with neighbour if out"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.signedIn) return;
        // Prefill only when signed in
        setBuyerName((n) => n || data.name || "");
        setBuyerEmail((e) => e || data.email || "");
        setShippingCity((c) => c || "London");
      })
      .catch(() => undefined);
  }, []);

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
          negotiatedPrice: payPrice,
          listPrice,
          negotiationSummary: summary || undefined,
          concessions: concessions || undefined,
          negotiated,
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
  const discount = Math.max(0, listPrice - payPrice);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-indigo-950">Checkout</h1>

      {negotiated && summary && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          <p className="text-sm font-medium text-indigo-950">Deal from live negotiation</p>
          <p className="mt-1 font-medium">{summary}</p>
          {concessions && (
            <p className="mt-1 text-xs text-indigo-800">↔ {concessions}</p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {buyerName ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Prefill from signed-in profile · {buyerName}
              {buyerEmail ? ` · ${buyerEmail}` : ""}
            </p>
          ) : (
            <p className="rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">
              Guest checkout.{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to prefill.
            </p>
          )}
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
          <h2 className="text-sm font-medium text-indigo-950">Order summary</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <Image
                  src={primary.image}
                  alt={productAlt(primary)}
                  width={48}
                  height={60}
                  className="h-14 w-11 rounded-md object-cover"
                />
                <span>
                  <span className="font-medium text-indigo-950">
                    {primary.brand} {primary.name}
                  </span>
                  <span className="block text-xs text-stone-500">
                    Primary{negotiated ? " · negotiated" : ""}
                  </span>
                </span>
              </span>
              <span className="text-right tabular-nums">
                {discount > 0 && (
                  <span className="block text-xs line-through text-stone-400">
                    {gbp(listPrice)}
                  </span>
                )}
                {gbp(payPrice)}
              </span>
            </li>
            {perk && (
              <li className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-2 py-1.5">
                <span className="flex items-center gap-3">
                  <Image
                    src={perk.image}
                    alt={productAlt(perk)}
                    width={48}
                    height={60}
                    className="h-14 w-11 rounded-md object-cover"
                  />
                  <span>
                    <span className="font-medium text-indigo-950">
                      {perk.brand} {perk.name}
                    </span>
                    <span className="block text-xs text-emerald-700">
                      Pair &amp; Perk · free
                    </span>
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
            {discount > 0 && (
              <div className="flex justify-between text-indigo-700">
                <span>Negotiated discount</span>
                <span>−{gbp(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-indigo-950">
              <span>Total</span>
              <span className="tabular-nums">{gbp(payPrice)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={busy || !buyerName || !buyerEmail || !shippingCity}
            onClick={() => void placeOrder()}
            className="mt-5 w-full rounded-full bg-indigo-950 py-2.5 text-sm font-semibold text-amber-50 hover:bg-indigo-900 disabled:opacity-50"
          >
            {busy
              ? "Placing order…"
              : negotiated
                ? "Confirm negotiated order"
                : "Confirm Pair & Perk order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-stone-500">Loading…</div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
