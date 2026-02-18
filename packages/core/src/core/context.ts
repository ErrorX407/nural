/**
 * CONTEXT & METADATA
 * Allows Guards/Interceptors to see "Who" is being called.
 */


// Default context extra props (allows accessing arbitrary props like .user by default)
export interface DefaultContext extends Record<string, any> {}

/**
 * Inference helper: Extracts the context type returned by a middleware
 *
 * @example
 * ```typescript
 * type AuthCtx = InferContext<typeof AuthMiddleware>;
 * ```
 */
export type InferContext<T> = T extends (
  ...args: any[]
) => Promise<infer R> | infer R
  ? R extends void
    ? {}
    : R
  : {};

export type ExecutionContext<Req = any, Extra = DefaultContext> = {
  req: Req;
  meta: Record<string, any>;
  handlerName: string;
} & Extra;