import { ExecutionContext } from "./execution-context.interface";
import { ForbiddenException } from "../exceptions/http-exception.class";

/**
 * Guards are specialized middleware responsible solely for authorization.
 * They must return `true` to pass, or `false` / throw a custom error to deny.
 *
 * - Return `false` → defaults to 403 Forbidden
 * - Throw `UnauthorizedException` → 401 Unauthorized
 * - Throw `ForbiddenException("...")` → 403 with custom message
 */
export type GuardHandler<Ctx = Record<string, any>, Req = any, Res = any> = (
  req: Req,
  context: ExecutionContext<Req, Res> & Ctx
) => Promise<boolean> | boolean;

export function defineGuard<Ctx = Record<string, any>, Req = any, Res = any>(fn: GuardHandler<Ctx, Req, Res>) {
  return async (req: Req, context: ExecutionContext<Req, Res>): Promise<boolean> => {
    const canActivate = await fn(req, context as ExecutionContext<Req, Res> & Ctx);
    if (!canActivate) {
      // Default to 403 Forbidden if guard returns false without throwing
      throw new ForbiddenException();
    }
    return true;
  };
}