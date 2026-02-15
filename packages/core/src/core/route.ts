/**
 * Route Helper
 */

import type { MiddlewareHandler } from "./middleware";
import type { ZodAny, RouteConfig } from "../types/route";

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
