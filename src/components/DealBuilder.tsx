"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gbp } from "@/lib/format";

export type BuilderTerm = { id: string; label: string; discount: number };

type Props = {
  product: { id: string; brand: string; name: string; image: string; alt: string; listPrice: number };
  floorPrice: number;
  terms: BuilderTerm[];
};

/** Rolls a number towards its new value, or jumps straight there with reduced motion */
function useRollingNumber(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduce || start === target) {
      from.current = target;
      const id = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(id);
    }
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / 450);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (target - start) * eased);
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}

function joinAnd(parts: string[]) {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

/**
 * The home page's pitch in one widget: tick what you're happy to give up and
 * watch the price come down, the way Finn trades on the real product page.
 */
export function DealBuilder({ product, floorPrice, terms }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [bump, setBump] = useState(0);
  const noReturns = picked.includes("final_sale");
  const active = picked.filter((id) => !(noReturns && id === "store_credit"));
  const off = terms.filter((t) => active.includes(t.id)).reduce((s, t) => s + t.discount, 0);
  const price = Math.max(floorPrice, product.listPrice - off);
  const atFloor = off > 0 && price === floorPrice;
  const shown = useRollingNumber(price);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setBump((b) => b + 1);
  }

  const given = terms.filter((t) => active.includes(t.id)).map((t) => t.label.toLowerCase());
  const said = joinAnd(given);
  const asked = said.charAt(0).toUpperCase() + said.slice(1);
  const finn =
    given.length === 0
      ? `${gbp(product.listPrice)} as listed. Give me something you don't need and I'll take it off the price.`
      : atFloor
        ? `${asked}? ${gbp(floorPrice)}, and that's as low as I go on this one.`
        : `${asked}? Then it's ${gbp(price)}.`;

  return (
    <div className="relative rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_0_#e7e5e4,0_18px_40px_-24px_rgba(29,37,80,0.35)] sm:p-5">
      <div className="flex items-center gap-3">
        <Image src={product.image} alt={product.alt} width={56} height={70} className="h-[70px] w-14 rounded-md object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-rinse">
            {product.brand} {product.name}
          </p>
          <p className="text-sm text-stone-500">Try a deal on a real listing</p>
        </div>
        <div className="text-right" aria-live="polite">
          <p
            key={bump}
            className={`font-slab text-4xl font-bold leading-none tabular-nums ${off > 0 ? "text-berry" : "text-rinse"} ${
              bump ? "motion-safe:animate-[price-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""
            }`}
          >
            {gbp(shown)}
          </p>
          <p className={`mt-1 text-sm tabular-nums text-stone-400 ${off > 0 ? "line-through" : "invisible"}`}>
            {gbp(product.listPrice)}
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm text-stone-600">What are you happy to give up?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {terms.map((t) => {
            const on = picked.includes(t.id);
            const covered = t.id === "store_credit" && noReturns;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                disabled={covered}
                onClick={() => toggle(t.id)}
                title={covered ? "Skipping returns already covers this" : undefined}
                className={`group rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch motion-safe:active:scale-95 motion-safe:transition-transform ${
                  on && !covered
                    ? "border-rinse bg-rinse text-white"
                    : covered
                      ? "cursor-not-allowed border-dashed border-stone-300 text-stone-400 line-through"
                      : "border-stone-300 bg-white text-stone-800 hover:border-rinse"
                }`}
              >
                {t.label}
                <span className={`ml-1.5 tabular-nums ${on && !covered ? "text-stitch" : "text-stone-400"}`}>
                  −{gbp(t.discount)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rinse font-slab text-sm font-bold text-white" aria-hidden>
          F
        </span>
        <p key={finn} className="rounded-2xl rounded-tl-sm bg-chambray px-3.5 py-2 text-sm text-rinse motion-safe:animate-[haggle-in_300ms_ease-out]">
          <span className="sr-only">Finn: </span>
          {finn}
        </p>
      </div>

      <Link
        href={`/product/${product.id}#negotiate`}
        className="mt-5 flex w-full items-center justify-center rounded-full bg-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-berry/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch"
      >
        Haggle with Finn for real
      </Link>
    </div>
  );
}
