/**
 * Route Types
 * Type definitions for route configuration and handlers
 */

import type { Request, Response } from "express";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import type { MiddlewareHandler } from "../core/middleware";
import type { HttpMethod } from "./http";
import { ExceptionFilterHandler, GuardHandler, InterceptorHandler } from "../core";

/**
 * Generic Zod type - either a Zod schema or undefined
 */
export type ZodAny = z.ZodTypeAny | undefined;

/**
 * Inference helper: extracts type from Zod schema, returns unknown if undefined
 */
export type InferZ<T extends ZodAny> = T extends z.ZodTypeAny
  ? z.infer<T>
  : unknown;

/**
 * Extract the return type of a single middleware
 */
type MiddlewareReturn<M> =
  M extends MiddlewareHandler<any, any> ? Awaited<ReturnType<M>> : {};

/**
 * Convert an array of middlewares into an intersection type
 * @example [{user: string}] & [{role: string}] -> {user: string, role: string}
 */
type MergeMiddlewareTypes<M extends MiddlewareHandler<any, any>[] | undefined> =
  M extends Array<any>
  ? MiddlewareReturn<M[number]> extends infer R
  ? R extends void
  ? {}
  : R
  : {}
  : {};

/**
 * Context passed to route handlers
 */
export type RouteContext<
  P extends ZodAny,
  Q extends ZodAny,
  B extends ZodAny,
  M extends MiddlewareHandler<any, any>[] | undefined,
  Services extends Record<string, unknown> = Record<string, unknown>
> = {
  /** Validated path parameters */
  params: InferZ<P>;
  /** Validated query parameters */
  query: InferZ<Q>;
  /** Validated request body */
  body: InferZ<B>;
  /** Raw request object (Express or Fastify) */
  req: Request | FastifyRequest;
  /** Raw response object (Express or Fastify) */
  res: Response | FastifyReply;
  /** Route metadata */
  meta: Record<string, any>;
} & MergeMiddlewareTypes<M> & Services;

/**
 * Route handler function type
 */
export type RouteHandler<
  P extends ZodAny,
  Q extends ZodAny,
  B extends ZodAny,
  R extends ZodAny,
  M extends MiddlewareHandler<any, any>[] | undefined,
  Services extends Record<string, unknown> = Record<string, unknown>
> = (
  ctx: RouteContext<P, Q, B, M, Services>,
) => Promise<InferZ<R> | void> | InferZ<R> | void;

/**
 * Route configuration object
 */
export interface RouteConfig<
  P extends ZodAny = undefined,
  Q extends ZodAny = undefined,
  B extends ZodAny = undefined,
  R extends ZodAny = undefined,
  M extends MiddlewareHandler<any, any>[] | undefined = undefined,
  Services extends Record<string, unknown> = Record<string, unknown>
> {
  /** HTTP method */
  method: HttpMethod;
  /** Route path (supports :param syntax) */
  path: string;
  /** Short summary for documentation */
  summary?: string;
  /** Detailed description for documentation */
  description?: string;
  /** Tags for grouping in documentation */
  tags?: string[];
  /** Guards to run before handler */
  guards?: GuardHandler[];
  /** Interceptors to run before and after handler */
  interceptors?: InterceptorHandler[];
  /** Middleware to run before handler */
  middleware?: M;
  /** Exception filters to handle errors */
  filters?: ExceptionFilterHandler[];
  /** Request validation schemas */
  request?: {
    /** Path parameters schema */
    params?: P;
    /** Query parameters schema */
    query?: Q;
    /** Request body schema */
    body?: B;
  };
  /** Response schemas by status code */
  responses?: Record<number, z.ZodTypeAny>;
  /**
   * OpenAPI Security Requirements
   * @example [{ bearerAuth: [] }]
   */
  security?: Array<Record<string, string[]>>;
  /**
   * OpenAPI Operation overrides
   * Allows full customization of the operation (e.g., custom headers, externalDocs)
   */
  openapi?: Record<string, any>;
  /**
   * Inject services into the route handler
   */
  inject?: Services;
  /** Route handler function */
  handler: RouteHandler<P, Q, B, R, M, Services>;
}

/** Helper type for "any route config" (used in arrays) */
export type AnyRouteConfig = RouteConfig<any, any, any, any, any, any> & {
  handler: RouteHandler<any, any, any, any, any, any>;
  meta?: Record<string, any>;
  guards?: any[];
  interceptors?: any[];
  filters?: any[];
};
