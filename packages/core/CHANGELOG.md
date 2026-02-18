# nural

## 0.3.10

### Patch Changes

- addf8d9: Refactor to monorepo structure and update dependencies.


### **New Version**

**`0.4.0`**
*(Bumped from `0.3.10` due to significant feature additions in CLI and architectural changes in Core)*

---

### **Branch Name**

```bash
feat/v0.4.0-upgrade-core-di-and-cli

```

---

### **Commit Message**

```text
feat(release): upgrade core to functional DI and enhance CLI capabilities (v0.4.0)

CORE:
- Implemented Functional Dependency Injection: Routes can now declare dependencies via the `inject` property.
- Fixed `createBuilder` and `createRoute` type inference to support localized service injection.
- Added `Schema` alias for Zod exports to prevent naming conflicts in user projects.
- Refactored `createModule` to treat `providers` as overrides/mocks rather than mandatory requirements.
- Fixed singular/plural naming conventions in framework types.

CLI:
- Implemented `nural generate <resource>` command for scaffolding Enterprise-ready modules (Service, Controller, Schema, Model).
- Implemented `nural add <integration>` command to easily add Redis, RabbitMQ, Prisma, and Mongoose support.
- Upgraded `nural new` scaffolding to include a full Auth module, E2E tests via `@nural/testing`, and production-ready `tsup` build configuration.
- Added auto-wiring logic to automatically register new modules in `app.ts`.
- Updated templates to match the new Functional DI patterns from Core.

```

---

### **Pull Request Description**

**(Copy and paste the markdown below)**

# 🚀 Release v0.4.0: Functional DI & Tier-1 CLI

## Summary

This release marks a significant milestone for Nural. We are introducing a fully **Functional Dependency Injection** system in the Core framework, allowing for safer and more intuitive service wiring. Simultaneously, the CLI has been upgraded to a "Tier-1" tool with the ability to generate resources, add integrations, and scaffold enterprise-grade applications by default.

## 📦 Core Framework Changes

### Functional Dependency Injection

* **`inject` Property:** Routes can now directly declare their dependencies.
```typescript
const services = { userService: UserService };
export const getUser = createRoute({
  inject: services, // Type-safe injection
  handler: async ({ userService }) => { ... }
});

```


* **Type Safety:** TypeScript now correctly infers the type of injected services inside the handler context.
* **`Schema` Alias:** Exported `z as Schema` to allow users to use `Schema.string()` alongside their own local `zod` imports without conflict.

## 🛠 CLI Enhancements

### 1. New Command: `nural generate <resource>` (alias: `g`)

* **Functionality:** Scaffolds a complete feature module following the new Domain-Driven Design.
* **Generated Files:**
* `src/modules/<name>/models/<name>.model.ts`
* `src/modules/<name>/schemas/<name>.request.ts` & `.response.ts`
* `src/modules/<name>/<name>.service.ts`
* `src/modules/<name>/<name>.controller.ts`
* `src/modules/<name>/<name>.module.ts`


* **Auto-Wiring:** Automatically imports and registers the new module in `src/app.ts`.

### 2. New Command: `nural add <integration>`

* **Functionality:** Allows users to add infrastructure integrations to an existing project.
* **Supported Integrations:**
* `redis` (ioredis)
* `rabbitmq` (amqplib)
* `mongoose` (MongoDB)
* `prisma-pg` (PostgreSQL + Prisma)


* **Automation:** Installs dependencies, generates the provider file in `src/providers/`, and provides instructions for `env.ts` configuration.

### 3. Upgrade: `nural new` Scaffolding

* **Enterprise Structure:** Now scaffolds projects with a dedicated `common`, `config`, and `modules` directory structure.
* **Batteries Included:**
* **Auth Module:** Includes a pre-built Authentication module (Login/Register) using the new Functional DI pattern.
* **Testing:** Pre-configured `vitest` with `@nural/testing` and a sample E2E test suite.
* **Build:** Added `tsup.config.ts` for production-ready builds.
* **Docker:** Auto-generates `docker-compose.yml` based on selected integrations.



## ☑️ Checklist

* [x] Core: Functional DI implemented and typed.
* [x] Core: `Schema` alias added.
* [x] CLI: `generate`, `add`, and `new` commands implemented.
* [x] CLI: Auto-registration logic for `app.ts` verified.
* [x] Templates updated to use new DI pattern.