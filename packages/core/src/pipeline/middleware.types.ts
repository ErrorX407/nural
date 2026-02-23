/**
 * Middleware Types and Helpers
 */

/**
 * Middleware handler function type
 * Returns data to be merged into route context
 */
export type MiddlewareHandler<Req = unknown, Res = unknown> = (
  req: Req,
  res: Res,
) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;

/**
 * Define a type-safe middleware
 *
 * @example
 * ```typescript
 * const authMiddleware = defineMiddleware(async (req: Request) => {
 *   const token = req.headers.authorization;
 *   if (!token) throw new Error('Unauthorized');
 *   return { user: { id: '123', role: 'admin' } };
 * });
 * ```
 */
export function defineMiddleware<
  T extends Record<string, unknown> | void,
  Req = unknown,
  Res = unknown,
>(fn: (req: Req, res: Res) => Promise<T> | T) {
  return fn;
}
