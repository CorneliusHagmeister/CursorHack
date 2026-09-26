# Negotiation API

An HTTP API that lets an AI assistant (ChatGPT, Claude, …) haggle with Indigo Lane on a shopper's behalf, then buy at the agreed price.

This is separate from the on-site deal desk (`/api/negotiate` + `NegotiatePanel`). Neither touches the other.

## How it works

- **Give to get, like enterprise pricing.** [`src/lib/negotiation/engine.ts`](../src/lib/negotiation/engine.ts) decides every number, and the price never drops for nothing. Each reduction is traded for a buyer commitment (a *term*):

  | Term id | Buyer gives | Off list |
  |---|---|---|
  | `final_sale` | Final sale, no returns | 8% |
  | `standard_shipping` | Standard 5-day shipping instead of next-day | £4 |
  | `fit_review` | Fit review with photos within 14 days | 6% |

  A hidden floor per product (20% under list by default) caps the total. A bare counter-offer gets "that price works if you give X", where X is the smallest trade that makes it work. If nothing gets that low, the merchant holds and shows its best offer. Pair & Perk adds value (a free pair at list price) instead of cutting price.
- **Claude only writes the words.** [`voice.ts`](../src/lib/negotiation/voice.ts) turns the engine's decision into a short reply from "Mo". Claude never sees the floor. If a reply mentions any £ amount or percentage the engine didn't produce, it is replaced by a template. Templates are also used when no key is set or the call fails.
- **Only structured fields are binding.** Prices go in `counterOffer` / `acceptOfferId`, never parsed from chat text. Purchase checks `price` against the server's agreed deal.

## Flow

```
listProducts → startNegotiation → sendNegotiationMessage (repeat) → purchaseNegotiatedDeal
```

Every response includes `availableTerms` (the menu above, in £ for this product), `offers` (what's on the table right now, each with the `terms` the buyer commits to), `status` (`open` → `agreed` → `purchased`) and a `guidance` string telling the agent what it can do next.

## Endpoints

| Method | Path | operationId |
|---|---|---|
| GET | `/api/products` | `listProducts` |
| POST | `/api/negotiations` | `startNegotiation` |
| GET | `/api/negotiations/{id}` | `getNegotiation` (includes transcript) |
| POST | `/api/negotiations/{id}/messages` | `sendNegotiationMessage` |
| POST | `/api/negotiations/{id}/purchase` | `purchaseNegotiatedDeal` |
| GET | `/api/openapi.json` | OpenAPI 3.1 spec |

### Start

```bash
curl -X POST $HOST/api/negotiations -H 'content-type: application/json' \
  -d '{"productId":"apc-petit-new","buyerName":"Sam"}'
```

```json
{
  "merchantReply": "Hi Sam! The A.P.C. Petit New Standard is £95. Or pay £95 and I'll throw in the Dickies 872 Slim Fit Work Pant (normally £28) for free — that's our Pair & Perk. Happy to hear an offer.",
  "negotiationId": "neg_4b4d…",
  "status": "open",
  "offers": [
    { "offerId": "r0-cash", "kind": "cash", "price": 95, "perk": null },
    { "offerId": "r0-perk-dickies-872", "kind": "pair-and-perk", "price": 95,
      "perk": { "productId": "dickies-872", "brand": "Dickies", "name": "872 Slim Fit Work Pant", "listPrice": 28 } }
  ],
  "guidance": "Send a message with counterOffer …"
}
```

Optional: `perkId` picks a specific free pair.

### Message, counter or accept

Body fields: `message` (text), plus:

- `counterOffer`: GBP number. The merchant replies with the terms that make it work (`decision: conditional`), or holds (`hold`). Add `includePerk: true` to counter on the bundle.
- `offerTerms`: term ids the buyer will give. Alone, you get a price quote (`quote`). With `counterOffer`, it's a full proposal; if it works, the deal closes (`accept_counter`).
- `acceptOfferId`: one of the current `offers[].offerId` (not combined with `counterOffer`).

`perkId` switches which free pair the bundle includes.

```bash
curl -X POST $HOST/api/negotiations/$ID/messages -H 'content-type: application/json' \
  -d '{"message":"Would you do 75?","counterOffer":75}'
```

The response adds `decision`: `conditional`, `quote`, `hold`, `accept_counter`, `accept_offer` or `info`.

Example run on the £95 A.P.C.:

| Buyer | Merchant |
|---|---|
| "Any chance of a discount?" | Explains the terms menu (£8 / £4 / £6 off) |
| counterOffer 90 | "I can do £90 if you post a fit review" |
| counterOffer 70 | Holds: best is £81 with all three terms (the floor) |
| offerTerms final_sale + standard_shipping | Quote: £83 |
| acceptOfferId (the £83 offer) | Agreed; the order records both commitments |

### Purchase

Only after `status` is `agreed`. `price` must equal `agreedDeal.price`.

```bash
curl -X POST $HOST/api/negotiations/$ID/purchase -H 'content-type: application/json' \
  -d '{"price":83,"buyerName":"Sam","buyerEmail":"sam@example.com","shippingCity":"London"}'
```

This creates a normal order (`negotiated-pair-and-perk`, with list price, discount, and a summary plus note listing what the buyer agreed to). It shows on `/merchant`.

### Errors

`{ "error": "…" }` with `400` (bad input), `404` (unknown product/session, or expired after 24h), or `409` (e.g. no deal yet, price mismatch, already purchased).

## Connecting an assistant

**ChatGPT:** create a GPT → Configure → Actions → Import from URL → `https://<host>/api/openapi.json`. Auth: none. `purchaseNegotiatedDeal` is marked `x-openai-isConsequential`, so ChatGPT asks the user before buying. Suggested GPT instruction: *"Negotiate for the user with the Indigo Lane actions. Relay merchantReply. Put prices only in counterOffer and terms the user agrees to in offerTerms. Explain what an offer's terms commit the user to, and get their OK before accepting or purchasing."*

**Claude:** use the same OpenAPI operations as tool definitions. An MCP wrapper around `src/lib/negotiation/service.ts` is the natural next step.

The host must be public (deployment or tunnel). ChatGPT can't reach localhost.

## Merchant dashboard

Merchant pages (`/merchant/*`) and APIs (`/api/merchant/*`, `GET /api/orders`, `PATCH /api/orders/{id}`) need a merchant session: sign in at `/merchant/login` with `MERCHANT_PASSWORD` (demo default `indigo-merchant`). The session is an HMAC-signed cookie checked in `src/proxy.ts`. The public agent API (`/api/negotiations`) and shopper checkout stay open.

- **`/merchant/live`** shows agent negotiations as they happen. With Supabase configured, every message is a row in `il_agent_negotiation_messages` and the page updates over Realtime; otherwise it polls every 2s. **Run simulated buyer** starts a scripted "ChatGPT agent" that haggles through the real API (a few seconds per turn) and buys.
- **Pricing policy per product** (floor, which terms are on offer and their £ value, allowed Pair & Perk pairs, selling points for the voice) lives in `il_negotiation_policies` (service role only, since it holds floors), or `data/policies.json` without Supabase. APIs: `GET /api/merchant/policies`, `PUT`/`DELETE /api/merchant/policies/{productId}`, `POST /api/merchant/simulate` (try an unsaved policy). The editor page is next.
- Migrations: `supabase/migrations/20260926140000_il_negotiation_policies.sql`, `20260926141000_il_agent_negotiations.sql`.

## Config

All optional; see `.env.example`.

| Variable | Effect |
|---|---|
| `AI_GATEWAY_API_KEY` | Merchant replies via Vercel AI Gateway (default model `claude-haiku-4-5`) |
| `ANTHROPIC_API_KEY` | Used when no gateway key is set; calls the Claude API directly |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Sessions and messages in Supabase (`il_agent_negotiations`, `il_agent_negotiation_messages`), streamed live to `/merchant/live`; otherwise in memory (lost on restart / across serverless instances) |
| `MERCHANT_MODEL` | Override the merchant model: a Claude id (`claude-sonnet-5`) or any gateway id (`openai/gpt-6-luna`) |
| `PUBLIC_BASE_URL` | Overrides the server URL in the OpenAPI spec |

Responses include `replySource: "llm" | "template"` so you can tell which voice answered.

## Known limits

- Orders use the shared file/memory store, so on serverless hosts they may not persist.
- No stock reservation: two agents can agree on the same pair.
- Endpoints are unauthenticated (demo only).
