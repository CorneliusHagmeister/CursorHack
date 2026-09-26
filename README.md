# Haggleberry

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

## Demo login (required for judges)

Safe shared demo account — use these on `/login` or over the agent APIs. No secrets.

| | |
| --- | --- |
| Email | `sam.okonkwo@example.com` |
| Password | `indigo-demo` |
| Agent bearer token | `il_demo_agent_token` |

Quick path: open `/login` → **Continue as demo shopper** → product → Make an offer.

## Shopper context

| Source | How | What they get |
| --- | --- | --- |
| Anonymous | open `/` | Catalogue only. Offers on price and perk. |
| Ad | `/?utm_campaign=raw-denim` then open a product | Campaign intent in the opener. No PII. |
| Login | `/login` → Continue as demo shopper | Sam's W31, £90 ceiling, abandoned A.P.C. |
| Agent | `Authorization: Bearer il_demo_agent_token` | Same as login over REST or MCP |
| One-time code | Account → Copy a note for your agent. Agent opens `/login` and enters the code. Nothing is active until that note is copied. | Size, budget, and past buys. Password stays with the shopper. The code works once. |

## Stage path

1. Open `/` as a generic shop (no Sam strip).
2. Sign in as demo shopper, or open `/product/apc-petit-new?utm_campaign=raw-denim` after login.
3. Make an offer. Finn opens on W31 vs W30 and £5 over the £90 budget at list price. Free pairs and extras are earned: the Pair & Perk bundle only appears once you push on price (or ask for it), and Finn only gives ground when your offer goes up.
4. Knock £10 off → Finn answers with a deal, not a discount (e.g. £88 for final sale, or the full bundle at list). "We'll take the deal" → Apply → Confirm → Merchant. Watch it live on `/merchant/live`.

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

Agents haggle with the merchant on a shopper's behalf. **Prices are decided deterministically** in [`src/lib/negotiation/engine.ts`](src/lib/negotiation/engine.ts) (deals, not discounts: price only moves for commitments like final sale or standard shipping, from a target toward a hidden walk-away; Pair & Perk and free hemming add value instead). The on-site deal desk, `/api/v1/negotiations`, the MCP `negotiate`/`place_order` tools and `/api/negotiations` all run on this one engine (`src/lib/negotiation/compat.ts` keeps the original connector shape). **An LLM only phrases the reply** ([`voice.ts`](src/lib/negotiation/voice.ts)) via Vercel AI Gateway (`AI_GATEWAY_API_KEY`) or the Claude API (`ANTHROPIC_API_KEY`); a reply that mentions any £ amount the engine didn't produce is replaced by a template.

| Method | Path | operationId |
|---|---|---|
| POST | `/api/auth/session-code/redeem` `{code}` | `redeemSessionCode` |
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
