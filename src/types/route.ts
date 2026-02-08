/**
 * Route Types
 * Type definitions for route configuration and handlers
 */

import type { z } from "zod";
import type { Request, Response } from "express";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { MiddlewareHandler } from "../core/middleware";
import type { HttpMethod } from "./http";

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
} & MergeMiddlewareTypes<M>;

/**
 * Route handler function type
 */
export type RouteHandler<
  P extends ZodAny,
  Q extends ZodAny,
  B extends ZodAny,
  R extends ZodAny,
  M extends MiddlewareHandler<any, any>[] | undefined,
> = (
  ctx: RouteContext<P, Q, B, M>,
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
  /** Middleware to run before handler */
  middleware?: M;
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
  /** Route handler function */
  handler: RouteHandler<P, Q, B, R, M>;
}

/**
 * Catch-all type for arrays of routes
 */
export type AnyRouteConfig = RouteConfig<any, any, any, any, any>;
