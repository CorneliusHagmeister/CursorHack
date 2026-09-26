/**
 * OpenAPI 3.1 spec for agent clients (ChatGPT GPT Actions, Claude tool use, etc.).
 * Import https://<host>/api/openapi.json as an Action schema.
 */

const offer = {
  type: "object",
  properties: {
    offerId: { type: "string", description: "Pass as acceptOfferId to accept this exact deal." },
    kind: { type: "string", enum: ["cash", "pair-and-perk"] },
    price: { type: "number", description: "GBP the buyer pays." },
    perk: {
      type: ["object", "null"],
      description: "Extra pair included free (Pair & Perk), or null.",
      properties: {
        productId: { type: "string" },
        brand: { type: "string" },
        name: { type: "string" },
        listPrice: { type: "number" },
      },
    },
  },
};

const negotiation = {
  type: "object",
  properties: {
    negotiationId: { type: "string" },
    status: { type: "string", enum: ["open", "agreed", "purchased"] },
    merchantReply: { type: "string", description: "What the merchant said. Relay it to the user." },
    decision: {
      type: "string",
      enum: ["accept_offer", "accept_counter", "counter", "final", "hold", "info"],
    },
    currency: { type: "string", enum: ["GBP"] },
    product: { type: "object" },
    round: { type: "integer" },
    finalOffer: { type: "boolean", description: "True once the merchant is at best-and-final." },
    offers: { type: "array", items: offer, description: "Deals currently on the table." },
    agreedDeal: { ...offer, type: ["object", "null"] },
    orderId: { type: ["string", "null"] },
    expiresAt: { type: "string", format: "date-time" },
    guidance: { type: "string", description: "What you can do next." },
  },
};

const error = {
  description: "Error",
  content: {
    "application/json": {
      schema: { type: "object", properties: { error: { type: "string" } } },
    },
  },
};

const idParam = {
  name: "negotiationId",
  in: "path",
  required: true,
  schema: { type: "string" },
};

function spec(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Indigo Lane Negotiation API",
      version: "0.1.0",
      description:
        "Haggle with Indigo Lane, a London second-hand denim shop, on behalf of a shopper. Flow: listProducts → startNegotiation → sendNegotiationMessage (counter or accept) → purchaseNegotiatedDeal. All prices are GBP. Only the offers returned by the API are binding; the merchant's words are not.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/auth/session-code/redeem": {
        post: {
          operationId: "redeemSessionCode",
          summary: "Turn a one-time code into shopper context",
          description:
            "The shopper copies a note from Account and pastes it to you. Prefer signing in at /login by typing the code. This endpoint is the API alternative: send the code, receive fit, budget, and past buys plus a bearer token. Never ask for their password. The code works once.",
          "x-openai-isConsequential": false,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["code"],
                  properties: {
                    code: {
                      type: "string",
                      description: "The code the shopper reads aloud, such as K7M Q2P.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Shopper context and a bearer token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      shopper: { type: "object" },
                      hint: { type: "string" },
                    },
                  },
                },
              },
            },
            "401": error,
          },
        },
      },
      "/api/demo/bank-statement": {
        get: {
          operationId: "getBankStatement",
          summary: "Read the shopper's recent card spends (fake demo data)",
          description:
            "Demo only: a pretend linked card, no real bank. Returns the last 90 days of spends with a denim summary, so you can see where the shopper's budget comes from. Needs the shopper's sign-in or the bearer token from their one-time code.",
          "x-openai-isConsequential": false,
          responses: {
            "200": {
              description: "Transactions and a denim summary",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      demo: { type: "boolean" },
                      cardLast4: { type: "string" },
                      transactions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            date: { type: "string", format: "date" },
                            merchant: { type: "string" },
                            amountGbp: { type: "number" },
                            category: { type: "string" },
                            cardLast4: { type: "string" },
                          },
                        },
                      },
                      denim: {
                        type: "object",
                        properties: {
                          count: { type: "integer" },
                          totalGbp: { type: "number" },
                          largestGbp: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": error,
            "404": error,
          },
        },
      },
      "/api/products": {
        get: {
          operationId: "listProducts",
          summary: "List jeans for sale",
          description: "Returns the catalogue with ids, list prices, sizes (waist/length) and condition. Use a product id to start a negotiation.",
          "x-openai-isConsequential": false,
          responses: {
            "200": {
              description: "Catalogue",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { products: { type: "array", items: { type: "object" } } },
                  },
                },
              },
            },
          },
        },
      },
      "/api/negotiations": {
        post: {
          operationId: "startNegotiation",
          summary: "Start haggling over a product",
          description: "Opens a negotiation session for one product. Returns the merchant's greeting and opening offers, usually list price and, if available, a Pair & Perk bundle with a free extra pair.",
          "x-openai-isConsequential": false,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId"],
                  properties: {
                    productId: { type: "string", description: "Product id from listProducts." },
                    buyerName: { type: "string", description: "Shopper's first name, for a friendlier chat." },
                    perkId: { type: "string", description: "Optional preferred free perk pair (product id)." },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Negotiation started", content: { "application/json": { schema: negotiation } } },
            "400": error,
            "404": error,
          },
        },
      },
      "/api/negotiations/{negotiationId}": {
        get: {
          operationId: "getNegotiation",
          summary: "Get negotiation state and transcript",
          description: "Returns current offers, status, any agreed deal and the full transcript.",
          "x-openai-isConsequential": false,
          parameters: [idParam],
          responses: {
            "200": { description: "Negotiation", content: { "application/json": { schema: negotiation } } },
            "404": error,
          },
        },
      },
      "/api/negotiations/{negotiationId}/messages": {
        post: {
          operationId: "sendNegotiationMessage",
          summary: "Talk to the merchant, counter-offer or accept",
          description: "Send a chat message. Put any price you propose in counterOffer; prices written only in message are ignored. To accept a deal, pass its offerId as acceptOfferId. Relay merchantReply to the user.",
          "x-openai-isConsequential": false,
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string", description: "What the shopper says to the merchant." },
                    counterOffer: { type: "number", description: "Price in GBP the shopper proposes. Omit if not making an offer." },
                    includePerk: { type: "boolean", description: "True if counterOffer is for the Pair & Perk bundle (with the free extra pair)." },
                    perkId: { type: "string", description: "Switch which free perk pair the bundle includes." },
                    acceptOfferId: { type: "string", description: "offerId from offers[] to accept. Do not combine with counterOffer. Only accept with the user's approval." },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Merchant response", content: { "application/json": { schema: negotiation } } },
            "400": error,
            "404": error,
            "409": error,
          },
        },
      },
      "/api/negotiations/{negotiationId}/purchase": {
        post: {
          operationId: "purchaseNegotiatedDeal",
          summary: "Buy at the agreed price",
          description: "Places the order for the agreed deal. Only call after the user explicitly confirms the price and their details. price must equal agreedDeal.price.",
          "x-openai-isConsequential": true,
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["price", "buyerName", "buyerEmail", "shippingCity"],
                  properties: {
                    price: { type: "number", description: "The agreed price in GBP (agreedDeal.price)." },
                    buyerName: { type: "string" },
                    buyerEmail: { type: "string" },
                    shippingCity: { type: "string" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Order placed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { order: { type: "object" }, negotiation: negotiation },
                  },
                },
              },
            },
            "400": error,
            "404": error,
            "409": error,
          },
        },
      },
    },
  };
}

export async function GET(req: Request) {
  const origin = process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin;
  return Response.json(spec(origin));
}
