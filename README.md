# Indigo Lane

Second-hand denim shop. The landing page is anonymous, like a logged-out Vinted visit. Fit, budget, and past buys appear only after an ad link, a sign-in, or a shopper's own agent.

## Stack

Next.js App Router, TypeScript, Tailwind v4, pnpm. Orders live in `data/orders.json` (or Supabase when configured). No API keys required for the stage demo.

## Run

```bash
cd ~/dev/CursorHack   # or the generic-shop worktree
pnpm install
pnpm run dev
pnpm run build
```

## Shopper context

| Source | How | What they get |
| --- | --- | --- |
| Anonymous | open `/` | Catalogue only. Offers on price and perk. |
| Ad | `/?utm_campaign=raw-denim` then open a product | Campaign intent in the opener. No PII. |
| Login | `/login` → Continue as demo shopper | Sam's W31, £90 ceiling, abandoned A.P.C. |
| Agent | `Authorization: Bearer il_demo_agent_token` | Same as login over REST or MCP |

## Stage path

1. Open `/` as a generic shop (no Sam strip).
2. Sign in as demo shopper, or open `/product/apc-petit-new?utm_campaign=raw-denim` after login.
3. Make an offer. First lines are W31 vs W30 and £5 over £90.
4. Knock £10 off → £85. Apply deal → Confirm → Merchant.

## Agent path (v1 + MCP)

```bash
# Start offer
curl -s -X POST http://localhost:3000/api/v1/negotiations \
  -H 'authorization: Bearer il_demo_agent_token' \
  -H 'content-type: application/json' \
  -d '{"productId":"apc-petit-new"}'

# Counter (use negotiationId from the response)
curl -s -X POST http://localhost:3000/api/v1/negotiations/NEG_ID/messages \
  -H 'authorization: Bearer il_demo_agent_token' \
  -H 'content-type: application/json' \
  -d '{"message":"Knock £10 off"}'
```

- OpenAPI: `/openapi.json`
- MCP: `/api/mcp` and `/mcp/http`
- Markdown: `Accept: text/markdown` on `/` or `/product/{id}`
- Score readiness: `npx is-agentic <preview-domain>`

## Negotiation API (ChatGPT / Claude Actions)

Full reference: [docs/negotiation-api.md](docs/negotiation-api.md).

Agents haggle with the merchant on a shopper's behalf. **Prices are decided deterministically** in [`src/lib/negotiation/engine.ts`](src/lib/negotiation/engine.ts) (hidden floor per product, concession curve, best-and-final after 4 rounds, Pair & Perk bundle as a lever). **Claude only phrases the reply** ([`voice.ts`](src/lib/negotiation/voice.ts)) via Vercel AI Gateway (`AI_GATEWAY_API_KEY`) or the Claude API (`ANTHROPIC_API_KEY`); a reply that mentions any £ amount the engine didn't produce is replaced by a template.

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

## Supabase (optional)

Project: **indigo-lane** (`qsedqcfzodffngzcrcgh`).

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref qsedqcfzodffngzcrcgh
supabase db push
supabase db query --linked -f supabase/seed.sql
```

Copy `.env.example` into `.env.local` with the project URL and publishable key. Without env, the app keeps using the seed catalogue and file store.

## Demo credentials

- Email: `sam.okonkwo@example.com`
- Password: `indigo-demo`
- Agent token: `il_demo_agent_token`
