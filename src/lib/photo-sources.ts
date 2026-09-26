/** Where each listing photo came from. Second-hand listings reuse the brand's own product shot of the same model. */
export type PhotoSource = { label: string; href: string };

export const PHOTO_SOURCES: Record<string, PhotoSource> = {
  "levi-501-indigo": {
    label: "80s Casual Classics",
    href: "https://www.80scasualclassics.co.uk/products/levis-501-original-fit-jeans-dark-indigo",
  },
  "wrangler-texas": {
    label: "Wild Wild Western Wear",
    href: "https://westernwear.co.uk/products/wrangler-w12133010-texas-medium-stretch-straight-jeans-in-stonewash",
  },
  "nudie-lean-dean": {
    label: "Nudie Jeans",
    href: "https://www.nudiejeans.com/en-GB/product/lean-dean-dry-16-dips",
  },
  "carhartt-pontiac": {
    label: "Collateral",
    href: "https://www.thecollateral.ch/products/carhartt-wip-pontiac-pant-blue-stone-washed-l32",
  },
  "dickies-872": {
    label: "Dickies",
    href: "https://dickies.eu/en-dk/products/872-slim-fit-work-trousers-dk0a4xk8dnx1-navy",
  },
  "uniqlo-wide": {
    label: "Uniqlo",
    href: "https://www.uniqlo.com/us/en/products/E462930-000/00",
  },
  "levi-550-relaxed": {
    label: "Dave's New York",
    href: "https://davesnewyork.com/products/levi-s-mens-550-relaxed-fit-jeans-medium-stonewash",
  },
  "apc-petit-new": {
    label: "A.P.C.",
    href: "https://www.apcstore.com/products/petit-new-standard-jeans-iai-codbs-m09047",
  },
  "weekday-ace": {
    label: "Weekday",
    href: "https://www.weekday.com/en-gb/p/men/jeans/loose-fit/astro-mid-rise-loose-baggy-unisex-jeans-saddle-blue-medium-blue-1114252048/",
  },
  "lee-101-z": {
    label: "Lee",
    href: "https://www.lee.com/shop/mens-lee-101-z-regular-fit-straight-leg-jean-7101ZR.html",
  },
  "edwin-ed55": {
    label: "Number Six",
    href: "https://www.numbersixlondon.com/products/edwin-ed-55-13oz-white-listed-black-selvage-jeans-rinsed",
  },
  "ms-autograph": {
    label: "M&S",
    href: "https://www.marksandspencer.com/slim-fit-360-flex-stretch-jeans/p/clp60685381",
  },
};
