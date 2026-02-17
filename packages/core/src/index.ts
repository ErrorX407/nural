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
export { createRoute, createModule, defineMiddleware, createBuilder } from "./core";
export { Logger } from "./core/logger";
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

// Re-export Zod for convenience
export { z as Schema } from "zod";
export { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
