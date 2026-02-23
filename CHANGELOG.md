# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-02-23

### 🚀 Added
- **Dependency Injection**: Added `defineProvider` and `inject()` for robust singleton and scoped provider injection.
- **Advanced Pipeline**: Added `defineGuard` for authorization and `defineInterceptor` for response transformation/caching.
- **Testing Module**: Introduced `@nuraljs/testing` providing zero-config, engine-agnostic E2E testing via `NuralTest` and `TestClient`.
- **Exception Filters**: Added a unified exception system with smart mapping (e.g., `NotFoundException`, `UnauthorizedException`) to standardized JSON responses.
- **CLI Architecture**: Extracted CLI terminal UI into `CliLogger` and `CliPrompts`.
- **CLI Scaffold Destructuring**: Broke down the CLI scaffolding engine into single-responsibility Factory and Service modules.
- **Unit Tests**: Added comprehensive test suites across the core framework and CLI under `__tests__/` directories.

### 🔄 Changed
- **Mass Rename**: Renamed the functional NPM packages from `nural` to `@nuraljs/core`, `@nuraljs/cli`, and `@nuraljs/testing` to resolve NPM registry conflicts.
- **Import Statements**: Updated all scaffolded EJS templates to natively import from `@nuraljs/core`.
- **CLI Commands**: Renamed all CLI command files to the NestJS-style `.command.ts` convention (e.g., `dev.ts` -> `dev.command.ts`).
- **Internal Domains**: Restructured tests alongside their corresponding domain logic (e.g., `src/pipeline/__tests__/`).
- **Module Resolution**: Updated CLI `tsconfig` to use `moduleResolution: Bundler` and removed legacy `.js` extensions from local imports.

### 🐛 Fixed
- Fixed strict TypeScript indexing errors (`noPropertyAccessFromIndexSignature`) in testing environments.
- Corrected monorepo build failures by appropriately linking workspace dependencies across the new `@nuraljs/*` scope.

---

## [0.6.0] - 2026-02-18

### 🚀 Features (WebSockets)

- **New WebSocket Architecture**: Introduced `createGateway` with a Fluent Builder API.
- **Schema-First Validation**: Incoming messages are automatically validated against Zod schemas defined in `payload`.
- **Dependency Injection**: Services are injected into all event handlers and lifecycle hooks.
- **Authentication Support**: Added `middleware` property for secure handshake authentication.
- **Strict Typing**: Full TypeScript support for custom `Socket` interfaces (e.g. `AuthedSocket`).

### 🐛 Fixes

- **Core**: Relaxed `registerGateway` generic constraints to allow custom Socket types (fixed `is not assignable to parameter of type Socket` error).

---

## [0.5.0] - 2026-02-18

### Core Framework (Enterprise Architecture)

- **Lifecycle Management**: Introduced `defineProvider` and `app.registerProvider()`. Nural now automatically manages connection (`init`) and cleanup (`destroy`) logic for databases and services, ensuring graceful shutdowns (LIFO order).
- **New Guard System**: `defineGuard` now receives a strictly typed `ExecutionContext` and returns a `boolean`. It can access route metadata (e.g., Roles) defined in `createRoute`.
- **New Interceptor System**: `defineInterceptor` now wraps the request execution (Onion Architecture), allowing logic to run *before* and *after* the handler, or transform the response.
- **Exception Filters**: Added `defineExceptionFilter` to catch and standardize errors globally or per-route.
- **Context & Metadata**: Added `meta` property to `createRoute`, allowing developers to attach static data (like permissions) that Guards can read at runtime.

### CLI (Health & Maintenance)

- **New Command: `nural doctor`**: Performs a deep health check on the environment (Node version, .env) and verifies TCP connectivity to infrastructure (Redis, Postgres, Mongo).
- **New Command: `nural update`**: Interactively scans and updates all `@nural/*` dependencies to their latest versions.
- **New Command: `nural completion`**: Generates a shell autocompletion script for Bash and Zsh.
- **Granular Generators**: `nural generate` (alias `g`) can now scaffold individual components:
  - `nural g middleware <name>`
  - `nural g guard <name>`
  - `nural g interceptor <name>`
  - `nural g provider <name>`
  - `nural g filter <name>`

---

## [0.4.1] - 2026-02-17

### CLI (Developer Experience Pack)

- **New Command: `nural routes`** (alias `list`): Displays a dynamically aligned, color-coded table of all registered API routes, methods, and authentication status.
- **New Command: `nural console`** (alias `tinker`): Launches an interactive Node.js REPL with the application context (`app`) pre-loaded for live debugging and testing.
- **New Command: `nural clean`**: Utility to remove build artifacts (`dist`, `coverage`) and temporary CLI files.
- **Improved JSON Generation**: Refactored `docs` and `routes` commands to use file-based data transfer instead of `stdout` capturing. This resolves JSON parsing errors caused by `dotenv` or database logs polluting the output.
- **Improved Script Execution**: Added `preferLocal: true` to all internal script executions, ensuring the CLI correctly locates the local `tsx` binary in all environments.

---

## [0.4.0] - 2026-02-17

### Core Framework (Functional DI & Architecture)

- **Functional Dependency Injection**: Introduced the `inject` property in `createRoute`, allowing routes to declare and infer dependencies directly.
- **`Schema` Alias**: Exported `z` as `Schema` (e.g., `Schema.string()`) to prevent naming conflicts with local Zod installations.
- **Module Refactor**: `createModule` now treats `providers` as overrides (useful for testing/mocking) rather than mandatory implementation links.
- **Type Inference Fixes**:
  - Fixed `createBuilder` to correctly infer types when mixing global and local middleware.
  - Improved type propagation for injected services in route handlers.

### CLI (Tier-1 Features)

- **New Command: `nural generate`** (alias `g`): Scaffolds full feature resources (Service, Controller, Module, Model, Schemas) following Domain-Driven Design.
- **New Command: `nural add`**: Instantly adds integrations (Redis, RabbitMQ, Mongoose, Prisma) to existing projects, handling dependencies and file generation.
- **Enhanced Scaffolding (`nural new`)**:
  - **Enterprise Structure**: Projects now default to a scalable `common/`, `modules/`, `config/` folder structure.
  - **Batteries Included**: New projects come with a fully functional **Auth Module** (Login/Register) pre-installed.
  - **Auto-Wiring**: The CLI automatically imports and registers new modules in `app.ts` when generated.
  - **Production Build**: Added `tsup.config.ts` for optimized production builds.
  - **Testing**: Pre-configured `vitest` with `@nural/testing` and sample E2E tests.
  - **Docker**: Auto-generates `docker-compose.yml` based on selected database/cache integrations.

---

## [0.2.0] - 2026-02-08

### Added

- **Advanced Documentation System**
  - **Swagger UI** Support: Switch between Scalar and Swagger UI with `ui: 'swagger'`.
  - **Flexible OpenAPI Configuration**: Full control over OpenAPI spec (Info, Servers, Components, Tags, ExternalDocs).
  - **Security Schemes**: Easy configuration for API Key, Bearer Auth (JWT), and OAuth2.
  - **Strict Typing**: Detailed TypeScript interfaces for `ScalarConfig` and `SwaggerConfig` with Intellisense.
  - **Scalar Customization**: Support for themes, layouts, sidebar settings, and more.
  - **Swagger Customization**: Support for outline/classic themes, persistant auth, and deep linking.
  - **Per-Route Configuration**:
    - **Route Security**: Define security schemes (e.g., `bearerAuth`) directly on routes.
    - **OpenAPI Overrides**: Add custom headers, external docs, or other OpenAPI fields per route.

---

## [0.1.0] - 2026-02-08

### Added

- **CORS middleware** - Zero-dependency CORS with full configuration
  - Support for single/multiple origins, dynamic origin functions
  - Credentials, preflight caching, exposed headers
- **Helmet middleware** - Security headers with zero dependencies
  - HSTS, X-Frame-Options, X-Content-Type-Options
  - CSP, Cross-Origin policies, Referrer-Policy
- **Global error handler** - Customizable error handling
  - Smart default: maps "unauthorized" → 401, "not found" → 404, Zod errors → 400
  - Custom handler support (e.g., Sentry integration)
  - Configurable logging, stack traces in dev mode
- Both middleware and error handler work with Express and Fastify

### Changed

- Updated `NuralConfig` to accept `cors`, `helmet`, and `errorHandler` options
- Server startup now logs enabled middleware

---

## [0.0.1] - 2026-02-08

### Added

- Initial release
- Schema-first route definition with `createRoute()`
- Zod-powered validation for params, query, and body
- Automatic response mapping (strips unlisted fields)
- Express adapter
- Fastify adapter
- Scalar documentation UI
- Type-safe middleware with context injection
- Configurable documentation settings

### Infrastructure

- TypeScript with strict mode
- tsup build with CJS + ESM + declarations
- Pure barrel file architecture