import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { productAlt } from "@/components/ProductCard";
import { getProduct } from "@/lib/products";
import { getOrder } from "@/lib/store";
import { gbp, formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const negotiated = order.mechanic === "negotiated-pair-and-perk";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-indigo-950">
          Thanks, {order.buyerName.split(" ")[0]}
        </h1>
        <p className="mt-3 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          Order confirmed
        </p>
        <p className="mt-2 text-sm text-stone-600">
          {formatWhen(order.createdAt)} · shipping to {order.shippingCity}
        </p>
        <p className="mt-1 font-mono text-xs text-stone-500">{order.id}</p>
        <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-900">
          {order.mechanic}
        </p>

        {order.negotiationSummary && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-950">
            <p className="text-sm font-medium text-indigo-950">From live negotiation</p>
            <p className="mt-1">{order.negotiationSummary}</p>
          </div>
        )}

        <ul className="mt-8 space-y-3">
          {order.items.map((item) => {
            const product = getProduct(item.productId);
            return (
              <li
                key={`${item.productId}-${item.role}`}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  {product && (
                    <Image
                      src={product.image}
                      alt={productAlt(product)}
                      width={48}
                      height={60}
                      className="h-14 w-11 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-indigo-950">
                      {item.brand} {item.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {item.role === "perk"
                        ? "Pair & Perk · complementary free"
                        : negotiated
                          ? "Primary · negotiated"
                          : "Primary · full price"}
                    </p>
                  </div>
                </div>
                <p className="tabular-nums font-medium">{gbp(item.price)}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 space-y-1 border-t border-stone-200 pt-4 text-sm">
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-indigo-700">
              <span>List {gbp(order.listPrice ?? order.total)}, negotiated</span>
              <span>−{gbp(order.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Total paid</span>
            <span className="text-2xl font-semibold tabular-nums text-indigo-950">
              {gbp(order.total)}
            </span>
          </div>
        </div>
        {order.perkSavings > 0 && (
          <p className="mt-1 text-right text-sm text-emerald-700">
            Perk value gifted {gbp(order.perkSavings)}
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
