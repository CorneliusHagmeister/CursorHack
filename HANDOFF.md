# IDE handoff, Indigo Lane

Continue in Cursor from here. Do not rewrite the app from scratch.

| | |
| --- | --- |
| Path | `~/dev/CursorHack` |
| Branch | `dev` (track `origin/dev`) |
| Remote | `https://github.com/CorneliusHagmeister/CursorHack.git` |
| Freeze | 16:30 London |

## Already on disk

- Next.js storefront and merchant, 12 seeded UK jeans, static Pair & Perk
- Returning shopper Sam Okonkwo in `src/lib/shopper.ts`, plus header, home, and product context
- Live NegotiatePanel, `/api/negotiate`, checkout and orders that accept a negotiated price
- Fit assist button, rule-based
- README. If it drifts, trust CONTEXT.md

## Before freeze

Merchant and order confirm already show the negotiation summary and discount. `npm run build` should pass.

Optional: rehearse the click path once. Tighten negotiate copy if a counter sounds vague.

## Demo click path

`/`, Sam strip and abandoned £95 cart, `/product/apc-petit-new#negotiate`, Start, "Knock £10 off", Apply deal, checkout Confirm, Merchant.

## npm

```bash
npm run dev
npm run build
```

## Leave these alone

- Do not replace the catalogue seed, the Pair & Perk mechanic, or the file/memory store.
- Do not invent API keys or a real LLM call for the stage demo.
- Do not clone elsewhere. Stay on `dev`.
- Do not remove ShopperContext or NegotiatePanel. They are the proof that the shop has a past and a live deal.
