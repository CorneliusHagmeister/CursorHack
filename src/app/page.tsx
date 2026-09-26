import Image from "next/image";
import Link from "next/link";
import { ProductCard, productAlt } from "@/components/ProductCard";
import { gbp } from "@/lib/format";
import { getProduct, listProducts } from "@/lib/products";

export default function HomePage() {
  const featured = getProduct("apc-petit-new");
  const also = ["nudie-lean-dean", "edwin-ed55"]
    .map((id) => getProduct(id))
    .filter((product) => product != null);
  const perks = listProducts()
    .filter((product) => product.perkEligible)
    .slice(0, 2);

  if (!featured) return null;

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-10">
        <Link
          href={`/product/${featured.id}#negotiate`}
          className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-stone-200"
          aria-label={`${featured.brand} ${featured.name}`}
        >
          <Image
            src={featured.image}
            alt={productAlt(featured)}
            fill
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
        </Link>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-indigo-950 sm:text-5xl">
            {featured.brand} {featured.name}
          </h1>
          <p className="mt-4 max-w-md text-lg text-stone-600">
            Raw indigo, still stiff. One London seller, unwashed.
          </p>
          <p className="mt-4 text-3xl font-semibold tabular-nums text-indigo-950">
            {gbp(featured.price)}
          </p>
          <Link
            href={`/product/${featured.id}#negotiate`}
            className="mt-8 inline-flex rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-medium text-amber-50 hover:bg-indigo-900"
          >
            Negotiate this pair
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-4 text-xl font-semibold text-indigo-950">Also in the shop</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {also.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <h2 className="mb-4 mt-12 text-xl font-semibold text-indigo-950">
          Free with Pair &amp; Perk
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {perks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
