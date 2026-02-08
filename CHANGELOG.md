# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
