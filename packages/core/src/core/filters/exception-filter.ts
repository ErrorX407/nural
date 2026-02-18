import { ExecutionContext } from "../context";

/**
 * Exception Filters
 * specialized interceptors that only run when an error is thrown.
 */
export type ExceptionFilterHandler<Err = any, Req = any, Res = any, Ctx = any> = (
  error: Err,
  req: Req,
  res: Res,
  context: ExecutionContext<Req, Ctx>
) => Promise<void> | void;

export function defineExceptionFilter<Err = any, Req = any, Res = any, Ctx = any>(
  fn: ExceptionFilterHandler<Err, Req, Res, Ctx>
) {
  return fn;
}