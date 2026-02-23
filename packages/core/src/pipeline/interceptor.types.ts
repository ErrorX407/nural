import { ExecutionContext } from "./execution-context.interface";

/**
 * Interceptors wrap the route handler. They can transform the request
 * BEFORE it reaches the handler, or transform the response AFTER.
 */
export type NextFn<T = any> = () => Promise<T>;

export type InterceptorHandler<Ctx = Record<string, any>, Req = any, T = any, Res = any> = (
  req: Req,
  next: NextFn<T>,
  context: ExecutionContext<Req, Res> & Ctx
) => Promise<T>;

export function defineInterceptor<Ctx = Record<string, any>, Req = any, T = any, Res = any>(
  fn: InterceptorHandler<Ctx, Req, T, Res>
) {
  return fn;
}