import { ExecutionContext } from "./context";

/**
 * Interceptors wrap the route handler. They can transform the request
 * BEFORE it reaches the handler, or transform the response AFTER.
 */
export type NextFn<T = any> = () => Promise<T>;

export type InterceptorHandler<Req = any, T = any, Ctx = any> = (
  req: Req,
  next: NextFn<T>,
  context: ExecutionContext<Req, Ctx>
) => Promise<T>;

export function defineInterceptor<Req = any, T = any, Ctx = any>(
  fn: InterceptorHandler<Req, T, Ctx>
) {
  return fn;
}