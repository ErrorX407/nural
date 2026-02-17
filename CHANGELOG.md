# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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