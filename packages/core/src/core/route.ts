/**
 * Route Helper
 */

import type { MiddlewareHandler } from "./middleware";
import type { ZodAny, RouteConfig } from "../types/route";

type CombinedMiddleware<
  Base extends MiddlewareHandler<any, any>[],
  Local extends MiddlewareHandler<any, any>[] | undefined
> = [...Base, ...(Local extends MiddlewareHandler<any, any>[] ? Local : [])];

/**
 * Create a type-safe route configuration
 *
 * @example
 * ```typescript
 * const userRoute = createRoute({
 *   method: 'GET',
 *   path: '/users/:id',
 *   summary: 'Get User by ID',
 *   request: { params: z.object({ id: z.string() }) },
 *   responses: { 200: z.object({ id: z.string(), name: z.string() }) },
 *   handler: async ({ params }) => {
 *     return { id: params.id, name: 'Chetan' };
 *   }
 * });
 * ```
 */
export function createRoute<
  P extends ZodAny = undefined,
  Q extends ZodAny = undefined,
  B extends ZodAny = undefined,
  R extends ZodAny = undefined,
  M extends MiddlewareHandler<any, any>[] | undefined = undefined,
>(config: RouteConfig<P, Q, B, R, M>): RouteConfig<P, Q, B, R, M> {
  return config;
}


/**
 * Route Builder Interface
 */
export interface RouteBuilder<
  BaseM extends MiddlewareHandler<any, any>[]
> {
  <
    P extends ZodAny = undefined,
    Q extends ZodAny = undefined,
    B extends ZodAny = undefined,
    R extends ZodAny = undefined,
    M extends MiddlewareHandler<any, any>[] | undefined = undefined
  >(
    // 🪄 The Magic Fix:
    // We ask for a RouteConfig typed with the *COMBINED* middleware (Base + Local).
    // This ensures the 'handler' expects the full context (e.g. ctx.user exists).
    // But we Omit 'middleware' because the user only passes the *Local* middleware array here.
    config: Omit<RouteConfig<P, Q, B, R, CombinedMiddleware<BaseM, M>>, "middleware"> & {
      middleware?: M; // User only provides local middleware
    }
  ): RouteConfig<P, Q, B, R, CombinedMiddleware<BaseM, M>>;
}

/**
 * The Builder Factory
 */
export function createBuilder<
  BaseM extends MiddlewareHandler<any, any>[]
>(baseMiddleware: BaseM): RouteBuilder<BaseM> {
  return <
    P extends ZodAny = undefined,
    Q extends ZodAny = undefined,
    B extends ZodAny = undefined,
    R extends ZodAny = undefined,
    M extends MiddlewareHandler<any, any>[] | undefined = undefined
  >(
    config: Omit<RouteConfig<P, Q, B, R, CombinedMiddleware<BaseM, M>>, "middleware"> & {
      middleware?: M;
    }
  ): RouteConfig<P, Q, B, R, CombinedMiddleware<BaseM, M>> => {

    // 1. Merge the middleware arrays at runtime
    const localMiddleware = (config.middleware || []) as MiddlewareHandler<any, any>[];
    const combinedMiddleware = [...baseMiddleware, ...localMiddleware];

    // 2. Return the full config object
    // We use 'as unknown as TargetType' to safely cast the result.
    // This is necessary because TypeScript cannot auto-infer that a runtime array spread 
    // matches a specific generic Tuple type signature without a cast.
    return {
      ...config,
      middleware: combinedMiddleware,
    } as unknown as RouteConfig<P, Q, B, R, CombinedMiddleware<BaseM, M>>;
  };
}