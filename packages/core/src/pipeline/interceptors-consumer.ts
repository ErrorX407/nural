
import { ExecutionContext } from "./execution-context.interface";
import { InterceptorHandler, NextFn } from "./interceptor.types";

export class InterceptorsConsumer {
  public async intercept<TRequest = unknown, TResponse = unknown>(
    interceptors: InterceptorHandler<any, TRequest, TResponse>[],
    req: TRequest,
    context: ExecutionContext<TRequest, TResponse>,
    next: NextFn<TResponse>
  ): Promise<TResponse> {
    if (!interceptors || interceptors.length === 0) {
      return next();
    }

    const runInterceptors = async (index: number): Promise<any> => {
      if (index >= interceptors.length) {
        return next();
      }

      const interceptor = interceptors[index];
      if (!interceptor) {
        return next();
      }
      return interceptor(req, () => runInterceptors(index + 1), context);
    };

    return runInterceptors(0);
  }
}
