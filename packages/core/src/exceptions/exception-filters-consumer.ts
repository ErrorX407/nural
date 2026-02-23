
import { ExecutionContext } from "../pipeline/execution-context.interface";
import { ExceptionFilterHandler } from "./filters/exception-filter";

export class ExceptionFiltersConsumer {
  public async apply<TError = unknown, TRequest = unknown, TResponse = unknown>(
    filters: ExceptionFilterHandler<TError, any, TRequest, TResponse>[],
    error: TError,
    req: TRequest,
    res: TResponse,
    context: ExecutionContext<TRequest, TResponse>
  ): Promise<boolean> {
    if (!filters || filters.length === 0) {
      return false;
    }

    for (const filter of filters) {
      await filter(error, req, res, context);
      if ((res as any).headersSent) {
        return true;
      }
    }

    return false;
  }
}
