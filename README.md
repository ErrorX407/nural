# Nural

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark-mode.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light-mode.png">
    <img alt="Nural Logo" src="assets/logo-light-mode.png" width="200">
  </picture>
</p>

<p align="center">
  <strong>The intelligent, schema-first REST framework for Node.js</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nural"><img src="https://img.shields.io/npm/v/nural.svg" alt="npm version"></a>
  <a href="https://github.com/ErrorX407/nural/actions/workflows/ci.yml"><img src="https://github.com/ErrorX407/nural/actions/workflows/ci.yml/badge.svg" alt="Build Status"></a>
  <img src="https://img.shields.io/npm/l/nural.svg" alt="license">
  <a href="https://www.npmjs.com/package/nural"><img src="https://img.shields.io/npm/dm/nural.svg" alt="Downloads"></a>
</p>

---

## Features

- ⚡ **Type-Safe** – End-to-end TypeScript inference
- 📝 **Auto Documentation** – OpenAPI spec & Scalar UI out-of-the-box
- 🛡️ **Validation** – Zod-powered input/output validation
- 🔄 **Response Mapping** – Auto-strip unlisted fields (no data leaks!)
- 🔌 **Multi-Framework** – Works with Express & Fastify
- 🎯 **Middleware Context** – Type-safe context injection
- 🔒 **Built-in Security** – CORS & Helmet with zero dependencies

---

## Installation

```bash
npm install nural express
# or
npm install nural fastify
```

---

## Quick Start

```typescript
import { Nural, createRoute, z } from "nural";

// Create app
const app = new Nural({ framework: "express", docs: true });

// Define a route
const helloRoute = createRoute({
  method: "GET",
  path: "/hello",
  summary: "Health check",
  responses: {
    200: z.object({ message: z.string() }),
  },
  handler: async () => {
    return { message: "Hello from Nural!", secret: "HIDDEN" };
    // ↑ 'secret' is auto-stripped from response!
  },
});

// Register and start
app.register([helloRoute]);
app.start(3000);
// 🚀 Server: http://localhost:3000
// 📚 Docs:   http://localhost:3000/docs
```

---

## Validation

```typescript
const userRoute = createRoute({
  method: "POST",
  path: "/users",
  request: {
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
    }),
  },
  responses: {
    201: z.object({ id: z.string(), name: z.string() }),
  },
  handler: async ({ body }) => {
    // body is typed as { name: string, email: string }
    return { id: "uuid", name: body.name };
  },
});
```

---

## Middleware

```typescript
import { defineMiddleware } from "nural";

const authMiddleware = defineMiddleware(async (req) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized");
  return { user: { id: "123", role: "admin" } };
});

const meRoute = createRoute({
  method: "GET",
  path: "/me",
  middleware: [authMiddleware],
  responses: { 200: z.object({ id: z.string(), role: z.string() }) },
  handler: async ({ user }) => {
    // ↑ 'user' is inferred from middleware!
    return user;
  },
});
```

---

## CORS & Helmet (Built-in Security)

```typescript
// Enable with defaults
const app = new Nural({
  cors: true,
  helmet: true,
});

// Or with full configuration
const app = new Nural({
  cors: {
    origin: "https://example.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
  helmet: {
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  },
});
  },
});
```

---

## Unified Exception System

Throw standard exceptions anywhere in your code, and Nural automatically formats them into standard JSON error responses.

```typescript
import { NotFoundException, UnauthorizedException } from "nural";

// In your service or handler
if (!user) {
  throw new NotFoundException("User not found");
}

if (!token) {
  throw new UnauthorizedException("Missing token");
}
```

**Result:**

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found",
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

---

````

## Global Error Handler

```typescript
// Enable with defaults (smart error mapping)
const app = new Nural({ errorHandler: true });

// Custom error handler (e.g., Sentry integration)
const app = new Nural({
  errorHandler: (ctx) => {
    Sentry.captureException(ctx.error);
    return {
      status: 500,
      body: { error: "Something went wrong" },
    };
  },
});

// Full configuration
const app = new Nural({
  errorHandler: {
    handler: customHandler,
    includeStack: process.env.NODE_ENV !== "production",
    logErrors: true,
    logger: (err, ctx) => winston.error(err.message, { path: ctx.path }),
  },
});
````

**Smart defaults:** Automatically maps `"unauthorized"` → 401, `"not found"` → 404, Zod errors → 400.

---

## Configuration

```typescript
const app = new Nural({
  framework: "fastify", // or 'express'
  cors: true, // Enable CORS
  helmet: true, // Enable security headers
  docs: {
    enabled: true,
    title: "My API",
    version: "2.0.0",
    description: "My awesome API",
    path: "/api-docs",
  },
});
```

---

## API Reference

### `createRoute(config)`

| Property         | Type                        | Description                    |
| ---------------- | --------------------------- | ------------------------------ |
| `method`         | `HttpMethod`                | GET, POST, PUT, PATCH, DELETE  |
| `path`           | `string`                    | Route path (supports `:param`) |
| `summary`        | `string?`                   | Short description for docs     |
| `description`    | `string?`                   | Detailed description           |
| `tags`           | `string[]?`                 | Grouping for docs              |
| `middleware`     | `array?`                    | Middleware functions           |
| `request.params` | `ZodSchema?`                | Path params validation         |
| `request.query`  | `ZodSchema?`                | Query params validation        |
| `request.body`   | `ZodSchema?`                | Body validation                |
| `responses`      | `Record<number, ZodSchema>` | Response schemas               |
| `handler`        | `function`                  | Route handler                  |

### `defineMiddleware(fn)`

Creates a type-safe middleware that injects context into handlers.

### `new Nural(config)`

| Property       | Type                           | Default     | Description              |
| -------------- | ------------------------------ | ----------- | ------------------------ |
| `framework`    | `'express' \| 'fastify'`       | `'express'` | Server framework         |
| `docs`         | `boolean \| DocsConfig`        | `true`      | Documentation settings   |
| `cors`         | `boolean \| CorsConfig`        | `false`     | CORS middleware settings |
| `helmet`       | `boolean \| HelmetConfig`      | `false`     | Security headers         |
| `errorHandler` | `boolean \| fn \| ErrorConfig` | `true`      | Global error handling    |

---

## License

MIT © [Chetan Joshi](https://github.com/ErrorX407)
