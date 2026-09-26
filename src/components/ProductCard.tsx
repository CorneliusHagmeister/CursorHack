import Image from "next/image";
import Link from "next/link";
import { gbp, productAlt } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  position: number;
};

const padIndex = (position: number) => String(position).padStart(2, "0");

export const ProductCard = ({ product, position }: ProductCardProps) => (
  <Link
    href={`/product/${product.id}`}
    className="group flex flex-col bg-floor p-3 outline-offset-[-2px] hover:bg-[#efefef]"
  >
    <div className="relative aspect-3/4">
      <Image
        src={product.image}
        alt={productAlt(product)}
        fill
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 48vw"
        className="object-contain mix-blend-multiply motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.19,1,0.22,1)] motion-safe:group-hover:scale-[1.03]"
      />
      {product.perkEligible && (
        <span className="text-caps absolute left-0 top-0 rounded-tile bg-white px-1.5 py-0.5 text-ink">
          Bundle
        </span>
      )}
    </div>
    <div className="mt-3 flex items-baseline justify-between gap-3">
      <span className="text-caps tabular-nums text-muted">{padIndex(position)}</span>
      <span className="text-caps tabular-nums text-ink">{gbp(product.price)}</span>
    </div>
    <p className="text-caps mt-1 truncate text-ink">
      {product.brand} {product.name}
    </p>
    <p className="text-caps text-muted">
      W{product.waist} · {product.condition}
    </p>
  </Link>
);
