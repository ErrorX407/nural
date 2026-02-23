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
export { Nural } from "./nural.application";
export {
  createRoute,
  createBuilder,
} from "./router/route.factory";
export {
  createModule,
} from "./router/module.factory";
export {
  defineMiddleware,
} from "./pipeline/middleware.types";
export {
  defineGuard,
} from "./pipeline/guard.types";
export {
  defineInterceptor,
} from "./pipeline/interceptor.types";
export {
  defineProvider,
} from "./lifecycle/provider-container";
export {
  defineConfig,
} from "./common/config.service";
export {
  type InferContext,
} from "./pipeline/execution-context.interface";
export * from "./router/route-storage.types";
export * from "./common/cron.types";
export * from "./common/websocket.types";

export { ConfigService } from "./common/config.service";
export { Logger } from "./common/logger.provider";
export { LoggerService } from "./common/logger.service";
export { CronService } from "./common/cron.service";
export type { LoggerConfig } from "./common/logger.provider";
export * from "./exceptions/http-exception.class";

// Type exports
export type {
  HttpMethod,
  HttpStatusCode,
} from "./common/http.types";

export type {
  NuralConfig,
  DocsConfig,
} from "./common/config.types";

export type {
  CorsConfig,
  HelmetConfig,
} from "./pipeline/middleware/middleware-config";

export type {
  ErrorHandler,
  ErrorHandlerConfig,
  ErrorContext,
} from "./exceptions/error-handler.provider";

export type {
  RouteConfig,
  RouteContext,
  RouteHandler,
  AnyRouteConfig,
  MergeMiddlewareTypes,
} from "./router/route-storage.types";

export type {
  GuardHandler,
} from "./pipeline/guard.types";

export type {
  InterceptorHandler,
  NextFn,
} from "./pipeline/interceptor.types";

export type {
  ProviderConfig,
  NuralProvider,
} from "./lifecycle/provider-container";

export type {
  ExceptionFilterHandler,
} from "./exceptions/filters/exception-filter";

export { defineExceptionFilter } from "./exceptions/filters/exception-filter";

// Re-export Zod for convenience
export { z as Schema } from "zod";
export { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
