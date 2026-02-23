<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark-mode.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light-mode.png">
    <img alt="Nural Logo" src="assets/logo-light-mode.png" width="300">
  </picture>
</p>

# Nural

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
- 📡 **Real-time** – Built-in Socket.io support (via CLI)
- 🎯 **Middleware Context** – Type-safe context injection
- 🔒 **Built-in Security** – CORS & Helmet with zero dependencies

---

## Installation

```bash
npm install @nuraljs/core zod express
# or
npm install @nuraljs/core zod fastify
```

---

## 🛠️ CLI

Nural comes with a powerful built-in CLI for scaffolding, generation, and DX tools.

```bash
# Install nural cli
npm install -g @nuraljs/cli

# Create a new enterprise-ready project
nural new my-api

# Add integrations to existing projects
nural add prisma
```

### DX Commands
- `nural doctor` - Health check environment & infrastructure
- `nural update` - Interactively install latest `@nuraljs/*` packages
- `nural routes` (alias `list`) - View all API endpoints & guards in color-coded matrix
- `nural console` (alias `tinker`) - Interactive app-loaded REPL for debugging
- `nural clean` - Utility to clear build artifacts & CLI temporary files
- `nural completion` - Generate shell autocompletion

### Granular Generators
```bash
nural generate route users
nural generate guard roles
nural generate interceptor cache
nural generate provider database
nural generate filter http-exception
```

---

## Quick Start

```typescript
import { Nural, createRoute, Schema } from "@nuraljs/core";

// Create app
const app = new Nural({ framework: "express", docs: true });

// Define a route
const helloRoute = createRoute({
  method: "GET",
  path: "/hello",
  summary: "Health check",
  responses: {
    200: Schema.object({ message: Schema.string() }),
  },
  handler: async () => {
    return { message: "Hello from NuralJS!" };
  }
});

app.register(helloRoute);

app.start(3000).then(() => {
  console.log("Server running on port 3000");
});
```

The official REST Framework for NuralJS. Nural is built around `Zod` and functional modules for ultimate intelligence. 

```bash
npm install @nuraljs/core
```

### Installation

```bash
pnpm install @nuraljs/core zod
# or
npm install @nuraljs/core zod
```

### 1. Controllers (Schema First)
Requests are functionally typed using strict validation. We use standard `try/catch` handlers for safety.

```typescript
import { createRoute, Schema } from "@nuraljs/core";
import { CreateUserDTO } from "./create-user.dto";

export const createUserController = createRoute({
  method: "POST",
  path: "/users",
  schema: {
    body: CreateUserDTO,
    response: {
      201: Schema.object({ id: Schema.string(), message: Schema.string() }),
      400: Schema.object({ error: Schema.string() })
    }
  },
  handler: async (req, res) => {
    // req.body is fully typed as CreateUserDTO
    const { name, email } = req.body;
    
    // Process business logic...
    return res.status(201).send({ id: "123", message: "User created" });
  }
});
```

### 2. Global & Local Middleware (Context Injection)
Middleware shouldn't just run code; it should inject type-safe context. Nural middleware returns an object that gets deeply merged into the request context.

```typescript
import { defineMiddleware } from "@nuraljs/core";
import { User } from "./models/user.model";

export const authMiddleware = defineMiddleware(async (req) => {
  const token = req.headers.authorization;
  if (!token) return { user: null }; // Inject null user

  const user = await User.findByToken(token);
  return { user }; // 🟢 Inject user into context
});
```

### 3. Guards (Authorization)
Guards receive the request and the **strongly-typed injected context** from your middleware.

```typescript
import { defineGuard, UnauthorizedException } from "@nuraljs/core";
// Import middleware for Type Inference
import { authMiddleware } from "./auth.middleware";
import type { MergeMiddlewareTypes } from "@nuraljs/core";

// Infer the context 
type MyContext = MergeMiddlewareTypes<[typeof authMiddleware]>;

export const authGuard = defineGuard<MyContext>((req, ctx) => {
  if (!ctx.user) {
    throw new UnauthorizedException("Authentication required"); 
  }
  
  if (ctx.user.role !== "admin") {
    return false; // Automatically throws 403 Forbidden
  }
  
  return true;
});

// Attach to route
export const adminRoute = createRoute({
  method: "GET",
  path: "/admin",
  middleware: [authMiddleware],
  guards: [authGuard],
  // ...
});
```

### 4. Interceptors (Response Transformation)
Interceptors can bind extra logic before/after execution, mutate responses, or handle caching.

```typescript
import { defineInterceptor } from "@nuraljs/core";

export const timeoutInterceptor = defineInterceptor(async (req, res, next) => {
  const start = Date.now();
  
  // Await the route execution
  const result = await next();
  
  const end = Date.now();
  console.log(`Execution time: ${end - start}ms`);
  
  // Mutate or wrap response
  return {
    data: result,
    _metadata: { timestamp: new Date() }
  };
});
```

### 5. Dependency Injection (Providers)
Create singletons or scoped services using functional Providers. Nural automatically manages connection (`setup`) and graceful cleanup (`teardown`).

```typescript
import { defineProvider, inject } from "@nuraljs/core";
import { PrismaClient } from "@prisma/client";

export const DatabaseProvider = defineProvider({
  token: "DATABASE",
  scope: "SINGLETON",
  setup: async () => {
    const prisma = new PrismaClient();
    await prisma.$connect();
    return prisma;
  },
  teardown: async (prisma) => {
    await prisma.$disconnect();
  }
});

// Inside a controller or service (Functional Injection)
const db = inject<PrismaClient>("DATABASE");
```

### 6. Route Builders & Modules
Group related routes, apply shared middleware, and prefix paths using Route Builders and Modules.

```typescript
import { createBuilder, createModule } from "@nuraljs/core";
import { authMiddleware } from "./auth.middleware";
import { authGuard } from "./auth.guard";

// 1. Create a Builder for secured routes
export const protectedRoute = createBuilder([authMiddleware], [authGuard]);

// 2. Use the Builder
export const getProfile = protectedRoute({
  method: "GET",
  path: "/me",
  handler: async ({ ctx }) => ctx.user
});

// 3. Group into a Module
export const usersModule = createModule({
  prefix: "/users",
  tags: ["Users"],
  routes: [getProfile]
});
```

### 7. Application Assembly
Assemble modules, middlewares, and providers in an un-opinionated standard.

```typescript
import { Nural, Logger } from "@nuraljs/core";
import { usersModule } from "./users/user.module";
import { DatabaseProvider } from "./providers/db.provider";

async function bootstrap() {
  const app = new Nural({ framework: "fastify" });
  
  // Register Providers
  await app.registerProvider(DatabaseProvider);
  
  // Register Modules
  app.registerModule(usersModule);
  
  await app.start(3000);
  Logger.info("Server started on port 3000");
}

bootstrap();
```

---

## 🔌 WebSockets (Schema-First)

Nural provides a schema-first WebSocket implementation via `createGateway`.

```typescript
import { createGateway, Schema } from "@nuraljs/core";

export const chatGateway = createGateway({
  namespace: "/chat",
  events: {
    "send-message": {
      payload: Schema.object({
        roomId: Schema.string(),
        content: Schema.string()
      }),
      handler: async (ctx) => {
        // ctx.data is fully typed & validated
        const { roomId, content } = ctx.data;
        ctx.socket.to(roomId).emit("new-message", content);
      }
    }
  }
});

// Register it
app.registerGateway(chatGateway);
```

---

## ⏰ Cron Jobs (Schema-First)

Nural allows you to define declarative, schema-first scheduled tasks:

```typescript
import { Nural } from "@nuraljs/core";

app.registerCron({
  name: 'SyncData',
  schedule: '0 0 * * *', // Every midnight
  task: async () => {
    app.logger.info("Executing daily sync...");
    // Business logic
  },
  runOnInit: true // Execute immediately on boot
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
```

---

## Unified Exception System

Throw standard exceptions anywhere in your code, and Nural automatically formats them into standard JSON error responses.

```typescript
import { NotFoundException, UnauthorizedException } from "@nuraljs/core";

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

### Exception Filters

Catch standard errors globally or per-route with functional exception filters:

```typescript
import { defineExceptionFilter } from "@nuraljs/core";

export const httpExceptionFilter = defineExceptionFilter({
  catch: (error) => error instanceof CustomException,
  handler: (error, ctx) => {
    ctx.res.status(400).send({ custom: true, error: error.message });
  }
});
```

---

## Logger & Observability

Nural comes with a built-in, zero-dependency advanced logger supporting:
- **Pretty Console Logging** for development
- **File Transport Logging** (structured JSON) for production
- **Correlation IDs (UUIDs)** automatically injected into requests
- **Configurable HTTP Logging** 

```typescript
import { Nural } from "@nuraljs/core";

const app = new Nural({
  framework: "fastify",
  logger: {
    // Global Settings
    enabled: true,
    minLevel: "debug", 
    timestamp: true, 

    // 1. Console Transport (Developer Experience)
    console: {
      enabled: true,
      json: false, // Pretty print
      minLevel: "debug",
      correlationId: false // Clean console
    },

    // 2. File Transport (Observability)
    file: {
      enabled: true,
      path: "./logs/app.log",
      json: true, // Structured logs
      minLevel: "info",
      correlationId: true // Track UUIDs across requests
    },

    // 3. HTTP Request Logging
    http: {
      userAgent: true,
    }
  }
});
```

Using the Logger inside your services:
```typescript
import { Logger } from "@nuraljs/core";

const logger = new Logger("MyService");

logger.info("Service initialized");
logger.warn("Be careful!");
logger.error("Something went wrong");
// Output: [Nural] 1234 - 2026-02-08... [MyService] Service initialized
```

```

---

## Testing (`@nuraljs/testing`)

Nural brings zero-configuration, engine-agnostic E2E testing using unified APIs built over `supertest` and `light-my-request`.

```bash
npm install @nuraljs/testing --save-dev
```

### E2E Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NuralTest, TestClient } from "@nuraljs/testing";
import { Nural } from "@nuraljs/core";
import { helloRoute } from "./hello.route";

describe("Hello API", () => {
  let app: Nural;
  let client: TestClient;

  beforeAll(async () => {
    app = new Nural({ framework: "fastify" });
    app.register([helloRoute]);
    
    // NuralTest auto-detects framework and mounts the correct mock agent
    client = await NuralTest.createClient(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 200 OK", async () => {
    const res = await client.get("/hello");
    
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: "Hello from Nural" });
  });
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
| `guards`         | `array?`                    | Guard functions                                |
| `interceptors`   | `array?`                    | Interceptor functions                          |
| `inject`         | `object?`                   | Services to inject into context                |
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
Creates a type-safe middleware that injects context into handlers (`ctx`).

### `defineGuard<Context>(fn)`
Creates a guard that approves or rejects a request based on context or metadata.

### `defineInterceptor(fn)`
Creates an interceptor that wraps route execution, allowing modification of responses or catching deep errors.

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
