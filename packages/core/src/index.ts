/**
 * Nural
 * The intelligent, schema-first REST framework for Node.js
 *
 * @packageDocumentation
 */

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Initialize Zod OpenAPI extension (side effect)
extendZodWithOpenApi(z);

// Core exports
export { Nural } from "./core";
export {
  createRoute,
  createModule,
  defineMiddleware,
  createBuilder,
  defineGuard,
  defineInterceptor,
  defineProvider,
  defineConfig,
  type InferContext,
} from "./core";
export * from "./types/route";
export * from "./types/cron";
export * from "./types/websocket";

// Coret * from "./types/websocket";

export { ConfigService } from "./core/config";
export { Logger } from "./core/logger";
export { LoggerService } from "./core/logger.service";
export { CronService } from "./core/cron.service";
export type { LoggerConfig } from "./core/logger";
export * from "./core/exceptions";

// Type exports
export type {
  HttpMethod,
  HttpStatusCode,
  NuralConfig,
  DocsConfig,
  CorsConfig,
  HelmetConfig,
  ErrorHandler,
  ErrorHandlerConfig,
  ErrorContext,
  RouteConfig,
  RouteContext,
  RouteHandler,
  AnyRouteConfig,
} from "./types";

export type {
  GuardHandler,
} from "./core/guards";

export type {
  InterceptorHandler,
  NextFn,
} from "./core/interceptor";

export type {
  ProviderConfig,
  NuralProvider,
} from "./core/provider";

export type {
  ExceptionFilterHandler,
} from "./core/filters/exception-filter";

export { defineExceptionFilter } from "./core/filters/exception-filter";

// Re-export Zod for convenience
export { z as Schema } from "zod";
export { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
