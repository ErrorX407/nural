import { ExecutionContext } from "../../pipeline/execution-context.interface";

/**
 * Exception Filters
 * specialized interceptors that only run when an error is thrown.
 */
export type ExceptionFilterHandler<Err = any, Ctx = Record<string, any>, Req = any, Res = any> = (
  error: Err,
  req: Req,
  res: Res,
  context: ExecutionContext<Req, Res> & Ctx
) => Promise<void> | void;

export function defineExceptionFilter<Err = any, Ctx = Record<string, any>, Req = any, Res = any>(
  fn: ExceptionFilterHandler<Err, Ctx, Req, Res>
) {
  return fn;
}