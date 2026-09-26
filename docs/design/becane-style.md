# Style study: Bécane Paris

Reference: [becaneparis.com](https://www.becaneparis.com/) (captured on Mobbin as "Becane"; the Mobbin preview needs a login, so this study uses the live site, 26 Sep 2026). Built by Period Paris on Shopify and Next.js.

## What makes it read as Bécane

**Near-white floor, near-black ink, no accent colour.** The page is `#F6F6F6`, text is `#0A0A0A`, and grey is the only other colour. Anything secondary, such as a count, a total, or an inactive state, is grey rather than smaller or lighter weight. The product photos carry all the colour.

**One extended display face, used big and uppercase.** Titles and the logo are Eurostile Extended in bold uppercase (`font-stretch: 125%`, weight 700). Everything else is the same family at 10–11px in uppercase with almost no tracking (0.4px). With only two sizes, the page reads as a label sheet, not an article.

**Small white panels float on the grey.** The header is a white block with a 3px radius, inset 12px from the viewport edge. The same white block, or its black inverse, holds the product-page buy bar and the footer rows. There are no shadows and no borders around panels.

**A product grid made of hairlines, not cards.** The index is a flat grey field divided by 1px lines. Each cell shows a cut-out packshot, small and centred, with a two-digit index (`01`, `02`…) bottom-left. Nothing else sits in the cell.

**Counters instead of headings.** "COLLECTION 01 / 01", "PRODUCTS 06 / 14", "CART 00". Position and quantity use zero-padded numbers in grey next to a black label.

**One black bar on the product page.** Full width, 3px radius: "ADD TO CART" on the left, "850 EUR" on the right. A small category label sits above a large extended title, with "DETAILS +" as a disclosure.

## How it maps to Indigo Lane

| Bécane | Indigo Lane |
| --- | --- |
| `#F6F6F6` floor, `#0A0A0A` ink | Same values as theme tokens `--color-floor` and `--color-ink`; hairlines `#E3E3E3` |
| Eurostile Extended | Archivo (Google Fonts, variable width axis) at `font-stretch: 125%`, weight 800, via `.font-display` |
| 10–11px uppercase UI | `.text-caps`: 11px, uppercase, `0.03em` tracking, medium weight. Body copy stays sentence case for readability |
| Floating white header | Sticky header panel inset 12px, 3px radius (`--radius-tile`) |
| Hairline packshot grid | `gap-px` grid on a hairline background. Photos use `object-contain` and `mix-blend-multiply`, so white studio backgrounds melt into the grey floor |
| `01` index per cell | Zero-padded position of the pair in the current results |
| Counters | "Showing 06 / 12", "Pair 03 / 12" on the product page |
| Black buy bar | "Buy now" on the left, price on the right; "Make an offer" as the white inverse |

Kept from our own rules (`.cursor/rules/ui-*.mdc`): no wide-tracked eyebrows (our caps use 0.03em, well under 0.1em), no emoji or ad-hoc glyphs, and one raised region per screen.

Left out on purpose: WebGL product turntables, the 3D landing, and the unusual menu. They carry the brand but slow a second-hand catalogue where shoppers compare twelve pairs at once.

## Photos

Listings are second-hand pairs of real products, so each listing now uses the maker's or a stockist's own product shot of that model, taken from the product page's main image. Sources are recorded per listing in `src/lib/photo-sources.ts` and credited on the product page.

Two listings were adjusted to match the photo available today: the Weekday pair is now the Astro Loose Baggy in Saddle Blue (the Ace is no longer sold), and the Edwin ED-55 is the black rinsed Kaguya selvedge. Levi's and Carhartt WIP block automated requests on their own sites, so their shots come from UK and EU stockists that carry the same product codes.
