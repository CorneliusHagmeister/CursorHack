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

## Negotiation API (for ChatGPT / Claude agents)

Full reference: [docs/negotiation-api.md](docs/negotiation-api.md).

Agents haggle with the merchant on a shopper's behalf. **Prices are decided deterministically** in [`src/lib/negotiation/engine.ts`](src/lib/negotiation/engine.ts) (give-to-get: the price only drops in exchange for buyer terms like final sale or standard shipping, capped by a hidden floor; Pair & Perk adds a free pair instead). **An LLM only phrases the reply** ([`voice.ts`](src/lib/negotiation/voice.ts)) via Vercel AI Gateway (`AI_GATEWAY_API_KEY`) or the Claude API (`ANTHROPIC_API_KEY`); a reply that mentions any £ amount the engine didn't produce is replaced by a template.

| Method | Path | operationId |
|---|---|---|
| GET | `/api/products` | `listProducts` |
| POST | `/api/negotiations` `{productId, buyerName?, perkId?}` | `startNegotiation` |
| GET | `/api/negotiations/{id}` | `getNegotiation` |
| POST | `/api/negotiations/{id}/messages` `{message, counterOffer?, includePerk?, perkId?, acceptOfferId?}` | `sendNegotiationMessage` |
| POST | `/api/negotiations/{id}/purchase` `{price, buyerName, buyerEmail, shippingCity}` | `purchaseNegotiatedDeal` |
| GET | `/api/openapi.json` | OpenAPI 3.1 spec |

**ChatGPT:** create a GPT → Actions → Import from URL → `https://<deployment>/api/openapi.json` (auth: none). Purchase is marked `x-openai-isConsequential`, so ChatGPT asks before buying. Needs a public URL (Vercel or a tunnel).

```bash
curl -X POST localhost:3000/api/negotiations -H 'content-type: application/json' -d '{"productId":"apc-petit-new"}'
curl -X POST localhost:3000/api/negotiations/<id>/messages -H 'content-type: application/json' -d '{"message":"Would you do 75?","counterOffer":75}'
```
