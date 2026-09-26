import Link from "next/link";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/store";
import { gbp, formatWhen } from "@/lib/format";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Order confirmed
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-indigo-950">
          Thanks, {order.buyerName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {formatWhen(order.createdAt)} · shipping to {order.shippingCity}
        </p>
        <p className="mt-1 font-mono text-xs text-stone-500">{order.id}</p>

        <ul className="mt-8 space-y-3">
          {order.items.map((item) => (
            <li
              key={`${item.productId}-${item.role}`}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-indigo-950">
                  {item.brand} {item.name}
                </p>
                <p className="text-xs text-stone-500">
                  {item.role === "perk"
                    ? "Pair & Perk · complementary free"
                    : "Primary · full price"}
                </p>
              </div>
              <p className="tabular-nums font-medium">{gbp(item.price)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="text-stone-600">Total paid</span>
          <span className="text-2xl font-semibold tabular-nums text-indigo-950">
            {gbp(order.total)}
          </span>
        </div>
        {order.perkSavings > 0 && (
          <p className="mt-1 text-right text-sm text-emerald-700">
            You saved {gbp(order.perkSavings)} with Pair &amp; Perk
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/merchant"
            className="rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-medium text-amber-50"
          >
            View in merchant dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm text-stone-700"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
