import { NextResponse } from "next/server";

export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Indigo Lane Agent API",
      version: "1.0.0",
      description:
        "Catalogue, live offers, and orders for shopper agents. Mirrors the website.",
    },
    servers: [{ url: "/" }],
    paths: {
      "/api/v1/products": {
        get: {
          summary: "Search catalogue",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "size", in: "query", schema: { type: "integer" } },
            { name: "brand", in: "query", schema: { type: "string" } },
            { name: "condition", in: "query", schema: { type: "string" } },
            { name: "max_price", in: "query", schema: { type: "number" } },
          ],
          responses: { "200": { description: "Product list" } },
        },
      },
      "/api/v1/products/{id}": {
        get: {
          summary: "Get product",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Product" }, "404": { description: "Missing" } },
        },
      },
      "/api/v1/negotiations": {
        post: {
          summary: "Start negotiation",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId"],
                  properties: { productId: { type: "string" } },
                },
              },
            },
          },
          responses: { "201": { description: "Opened negotiation" } },
        },
      },
      "/api/v1/negotiations/{id}/messages": {
        post: {
          summary: "Send negotiation message",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          responses: { "200": { description: "Counter" } },
        },
      },
      "/api/v1/orders": {
        post: {
          summary: "Place order",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Order created" } },
        },
      },
      "/api/v1/orders/{id}": {
        get: {
          summary: "Get order",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Order" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Agent token from /account or il_demo_agent_token",
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: { "Content-Type": "application/json" },
  });
}
