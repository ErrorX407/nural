import { ExecutionContext } from "./context";

/**
 * Guards are specialized middleware responsible solely for authorization.
 * They must return `true` to pass, or `false` to throw 403 Forbidden.
 * They can also throw custom errors.
 */
export type GuardHandler<Req = any, Ctx = any> = (
  req: Req, 
  context: ExecutionContext<Req, Ctx>
) => Promise<boolean> | boolean;

export function defineGuard<Req = any, Ctx = any>(fn: GuardHandler<Req, Ctx>) {
  // Wrapper that framework calls
  return async (req: Req, meta: Record<string, any> = {}) => {
    const context = {
      req,
      meta,
      handlerName: "unknown" // Framework injects this at runtime
    } as ExecutionContext<Req, Ctx>;

    const canActivate = await fn(req, context);
    if (!canActivate) {
      const error = new Error("Forbidden resource");
      (error as any).statusCode = 403;
      throw error;
    }
  };
}