/**
 * Basic Example - Hello World API
 *
 * Run: npx tsx examples/basic/server.ts
 */

import { Nural, createRoute, z } from "../../src";

// Create app with all features enabled
const app = new Nural({
  framework: "express",
  cors: true,
  helmet: true,
  errorHandler: true,
  docs: {
    title: "Basic API",
    version: "1.0.0",
    description: "A simple Nural API example",
  },
});

// Health check route
const healthRoute = createRoute({
  method: "GET",
  path: "/health",
  summary: "Health check",
  tags: ["System"],
  responses: {
    200: z.object({
      status: z.string(),
      timestamp: z.string(),
    }),
  },
  handler: async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
});

// Hello route with query params
const helloRoute = createRoute({
  method: "GET",
  path: "/hello",
  summary: "Say hello",
  tags: ["Greeting"],
  request: {
    query: z.object({
      name: z.string().optional().default("World"),
    }),
  },
  responses: {
    200: z.object({
      message: z.string(),
    }),
  },
  handler: async ({ query }) => ({
    message: `Hello, ${query.name}!`,
  }),
});

// Echo route with body
const echoRoute = createRoute({
  method: "POST",
  path: "/echo",
  summary: "Echo back the request body",
  tags: ["Utility"],
  request: {
    body: z.object({
      data: z.unknown(),
    }),
  },
  responses: {
    200: z.object({
      received: z.unknown(),
      receivedAt: z.string(),
    }),
  },
  handler: async ({ body }) => ({
    received: body.data,
    receivedAt: new Date().toISOString(),
  }),
});

// Register routes and start
app.register([healthRoute, helloRoute, echoRoute]);
app.start(3000);
