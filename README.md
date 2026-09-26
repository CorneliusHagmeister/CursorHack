# Indigo Lane

Second-hand jeans for the Fleek London hack. Pair & Perk is the buy: pay for a hero pair, take a perk pair free. The deal desk remembers Sam Okonkwo and negotiates where you can see it.

CONTEXT.md is the stage notes. HANDOFF.md is the IDE pickup.

## Stack

Next.js App Router, TypeScript, Tailwind v4, npm. Orders live in a file or in memory. No API keys.

## Run

```bash
cd ~/dev/CursorHack
npm install
npm run dev
npm run build
```

Dev server: http://localhost:3000

## Env

Copy `.env.example` only if you want the Supabase placeholders. The demo runs without them.

## Demo

Sam Okonkwo, London, waist 31, A.P.C. and Nudie, budget £90. He left an A.P.C. cart at £95 last week.

1. Home. The banner is his fit, brands, past purchases, and last session.
2. Negotiate on A.P.C., or open `/product/apc-petit-new#negotiate`, then Start live negotiation.
3. The desk opens on W31 vs W30, and on £95 being £5 over the £90 ceiling. Send "Knock £10 off". That lands at £85. Then Apply deal to checkout.
4. Checkout is already filled in as Sam. Confirm.
5. Merchant shows `negotiated-pair-and-perk` and the negotiation summary.

Click path: `/`, Sam strip and the abandoned £95 cart, `/product/apc-petit-new#negotiate`, Start, Knock £10 off, Apply deal, Confirm, `/merchant`. Merchant already has one shipped Nudie order so GMV is not £0.
