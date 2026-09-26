# IDE handoff — Indigo Lane

**Continue in Cursor IDE from here. Do not rewrite the app from scratch.**

| | |
|---|---|
| **Path** | `~/dev/CursorHack` (`/Users/manglekuo/dev/CursorHack`) |
| **Branch** | `dev` (track `origin/dev`) |
| **Remote** | `https://github.com/CorneliusHagmeister/CursorHack.git` |
| **Freeze** | 16:30 London |

## Shipped (on disk / pushing)

- Next.js storefront + merchant, 12 seeded UK jeans, Pair & Perk static flow
- **Returning shopper** Sam Okonkwo (`src/lib/shopper.ts`) + header/home/product context UI
- **Live NegotiatePanel** + `/api/negotiate` + checkout/orders accept negotiated price/summary
- Fit assist FAB (rule-based)
- README (may lag — prefer CONTEXT.md spine)

## In-flight / finish before freeze

**Done in follow-up commit:** merchant + order confirm show negotiation summary/discount; README demo script tightened; `npm run build` passes.

Optional polish before 16:30: stage-rehearse the click-path once; tweak negotiate copy if judges want sharper counters.

## Demo click-path (memorise)

`/` → show Sam banner → `/product/apc-petit-new#negotiate` → Start → “Too pricey — knock £10 off” → Apply deal → checkout Confirm → Merchant.

## npm

```bash
npm run dev
npm run build
```

## What not to rewrite

- Don’t replace catalogue seed, Pair & Perk mechanic, or file/memory store with a new stack.
- Don’t invent API keys / real LLM calls for the stage demo.
- Don’t clone elsewhere; stay on `dev`.
- Don’t remove ShopperContext / NegotiatePanel — they are the Fleek “past context + live interaction” proof.
