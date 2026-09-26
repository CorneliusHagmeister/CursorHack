import Image from "next/image";
import Link from "next/link";
import { productAlt } from "@/components/ProductCard";
import { listOrders } from "@/lib/store";
import { listProducts } from "@/lib/products";
import { gbp, formatWhen } from "@/lib/format";
import { MerchantActions } from "@/components/MerchantActions";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const [orders, products] = await Promise.all([listOrders(), Promise.resolve(listProducts())]);
  const gmv = orders.reduce((s, o) => s + o.total, 0);
  const perkGiven = orders.reduce((s, o) => s + o.perkSavings, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-indigo-950">Indigo Lane desk</h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-white"
        >
          Consumer storefront
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", String(orders.length)],
          ["GMV (paid)", gbp(gmv)],
          ["Perk value gifted", gbp(perkGiven)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-stone-200 bg-white px-5 py-4"
          >
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-indigo-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-indigo-950">Incoming orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white/50 px-5 py-8 text-center text-sm text-stone-500">
            No orders yet. Demo path: home, product, live negotiate, checkout,
            then land here.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-indigo-950">
                      {order.buyerName}{" "}
                      <span className="font-normal text-stone-500">
                        · {order.shippingCity}
                      </span>
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatWhen(order.createdAt)} · {order.id}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                      {order.mechanic}
                    </p>
                    {order.channel && (
                      <p className="mt-1 text-xs text-stone-500">
                        via {order.channel}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-indigo-950">
                      {gbp(order.total)}
                    </p>
                    {order.perkSavings > 0 && (
                      <p className="text-xs text-emerald-700">
                        perk gifted {gbp(order.perkSavings)}
                      </p>
                    )}
                    <p className="mt-1 text-xs capitalize text-stone-500">
                      status: {order.status}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1 text-sm text-stone-700">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.productId}-${item.role}`}>
                      {item.brand}{" "}
                      {item.name}{" "}
                      <span className="text-stone-400">
                        ({item.role}) · {gbp(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
                {order.negotiationSummary && (
                  <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
                    <span className="font-semibold">Negotiation: </span>
                    {order.negotiationSummary}
                    {(order.discount ?? 0) > 0 && (
                      <span>
                        {" "}
                        List {gbp(order.listPrice ?? order.total)}, paid{" "}
                        {gbp(order.total)} (off {gbp(order.discount)})
                      </span>
                    )}
                  </p>
                )}
                <MerchantActions orderId={order.id} status={order.status} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-indigo-950">
          Catalogue ({products.length})
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-sm text-stone-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-50 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/product/${p.id}`}
                      className="flex items-center gap-3 font-medium text-indigo-900 hover:underline"
                    >
                      <Image
                        src={p.image}
                        alt={productAlt(p)}
                        width={40}
                        height={50}
                        className="h-12 w-10 rounded-md object-cover"
                      />
                      <span>
                        {p.brand} {p.name}
                        <span className="block text-xs font-normal text-stone-500">
                          {p.city}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    W{p.waist} L{p.length}
                  </td>
                  <td className="px-4 py-3">{p.condition}</td>
                  <td className="px-4 py-3 tabular-nums">{gbp(p.price)}</td>
                  <td className="px-4 py-3">
                    {p.perkEligible ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        perk
                      </span>
                    ) : (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-900">
                        hero
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
