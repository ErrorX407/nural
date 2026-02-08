# Nural

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark-mode.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light-mode.png">
    <img alt="Nural Logo" src="assets/logo-light-mode.png" width="300">
  </picture>
</p>

<p align="center">
  <strong>The intelligent, schema-first REST framework for Node.js</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ "><img src="https://img.shields.io/npm/v/nural.svg" alt="npm version"></a>
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

## 🛠️ CLI

Nural comes with a built-in CLI to help you scaffold projects and generate resources.

```bash
# Create a new project
npx nural new my-api

# Generate resources
npx nural generate route users
npx nural generate middleware auth
npx nural generate service user
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
```

**Smart defaults:** Automatically maps `"unauthorized"` → 401, `"not found"` → 404, Zod errors → 400.

### Available Exceptions

| Exception                       | Status Code |
| :------------------------------ | :---------- |
| `BadRequestException`           | 400         |
| `UnauthorizedException`         | 401         |
| `ForbiddenException`            | 403         |
| `NotFoundException`             | 404         |
| `ConflictException`             | 409         |
| `GoneException`                 | 410         |
| `PayloadTooLargeException`      | 413         |
| `UnsupportedMediaTypeException` | 415         |
| `UnprocessableEntityException`  | 422         |
| `InternalServerErrorException`  | 500         |
| `NotImplementedException`       | 501         |
| `BadGatewayException`           | 502         |
| `ServiceUnavailableException`   | 503         |
| `GatewayTimeoutException`       | 504         |

---

## Logger

Nural comes with a built-in, zero-dependency logger that is lightweight and colorful.

```typescript
import { Logger } from "nural";

const logger = new Logger("MyService");

logger.log("This is a log message");
logger.warn("Be careful!");
logger.error("Something went wrong");
// Output: [Nural] 1234 - 2026-02-08... [MyService] This is a log message
```

### HTTP Logger

The HTTP logger middleware is enabled by default and logs all incoming requests with their status and duration.

```typescript
const app = new Nural({
  logger: {
    enabled: true,
    showUserAgent: true, // Log User-Agent header
    showTime: true, // Log request duration (default: true)
  },
});
```

---

## Configuration

```typescript
const app = new Nural({
  framework: "fastify", // or 'express'
  cors: true, // Enable CORS with defaults
  helmet: true, // Enable security headers with defaults

  // Documentation
  docs: {
    enabled: true,
    path: "/api-docs",
    ui: "scalar", // 'scalar' (default) or 'swagger'

    // Full OpenAPI Customization
    openApi: {
      info: {
        title: "My API",
        version: "2.0.0",
        description: "My awesome API",
      },
      servers: [{ url: "https://api.example.com" }],
      // Add Security Schemes (e.g., API Key, Bearer Token)
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      // Apply Global Security
      security: [{ bearerAuth: [] }],
    },

    // Scalar UI Options (fully typed)
    scalar: {
      theme: "moon", // 'alternate', 'default', 'moon', 'purple', 'solarized', etc.
      layout: "modern",
      showSidebar: true,
      hideModels: true,
      darkMode: true,
      // Custom Metadata
      metaData: { title: "API Docs" },
      // Authentication Pre-fill
      authentication: {
        preferredSecurityScheme: "bearerAuth",
        securitySchemes: {
          bearerAuth: { token: "EXAMPLE_TOKEN" },
        },
      },
    },

    // Swagger UI Options (fully typed)
    swagger: {
      theme: "outline", // 'outline', 'classic', or 'no-theme'
      options: {
        persistAuthorization: true,
        docExpansion: "list",
        defaultModelsExpandDepth: -1,
        filter: true,
        syntaxHighlight: { theme: "monokai" },
      },
    },
  },

  // Logger
  logger: {
    enabled: true,
    showUserAgent: false,
    showTime: true,
  },

  // Error Handling
  errorHandler: {
    handler: customHandler, // Optional custom handler
    includeStack: false, // Hide stack traces in production
    logErrors: true, // Log errors to console
  },
});
```

---

## API Reference

### `createRoute(config)`

| Property         | Type                        | Description                                    |
| ---------------- | --------------------------- | ---------------------------------------------- |
| `method`         | `HttpMethod`                | GET, POST, PUT, PATCH, DELETE                  |
| `path`           | `string`                    | Route path (supports `:param`)                 |
| `summary`        | `string?`                   | Short description for docs                     |
| `description`    | `string?`                   | Detailed description                           |
| `tags`           | `string[]?`                 | Grouping for docs                              |
| `middleware`     | `array?`                    | Middleware functions                           |
| `request.params` | `ZodSchema?`                | Path params validation                         |
| `request.query`  | `ZodSchema?`                | Query params validation                        |
| `request.body`   | `ZodSchema?`                | Body validation                                |
| `responses`      | `Record<number, ZodSchema>` | Response schemas                               |
| `security`       | `array?`                    | OpenAPI security (e.g. `[{ bearerAuth: [] }]`) |
| `openapi`        | `object?`                   | OpenAPI operation overrides                    |
| `handler`        | `function`                  | Route handler                                  |

### Per-Route Configuration (Security & Headers)

You can define security requirements or override OpenAPI properties directly on the route:

```typescript
const protectedRoute = createRoute({
  method: "GET",
  path: "/protected",
  // Define security requirements
  security: [{ bearerAuth: [] }],
  // Override OpenAPI operation (e.g., custom headers)
  openapi: {
    parameters: [
      {
        in: "header",
        name: "X-Custom-Header",
        schema: { type: "string" },
        required: true,
      },
    ],
  },
  handler: async () => {
    return { secret: "data" };
  },
});
```

### Route Context (`ctx`)

The `handler` receives a `ctx` object containing:

```typescript
{
  params: { id: "123" },      // Validated path params
  query: { page: 1 },         // Validated query params
  body: { name: "John" },     // Validated body
  req: Request,               // Native request object
  res: Response,              // Native response object
  ...middlewareProps          // Properties injected by middleware
}
```

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
