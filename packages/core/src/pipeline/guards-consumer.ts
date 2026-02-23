
import { ExecutionContext } from "./execution-context.interface";
import { GuardHandler } from "./guard.types";
import { ForbiddenException } from "../exceptions/http-exception.class";

export class GuardsConsumer {
  public async tryActivate<TRequest = unknown>(
    guards: GuardHandler<any, TRequest>[],
    req: TRequest,
    context: ExecutionContext<TRequest>
  ): Promise<void> {
    if (!guards || guards.length === 0) {
      return;
    }

    for (const guard of guards) {
      // If the guard throws its own HttpException (e.g. UnauthorizedException),
      // it will propagate up naturally. We only create a ForbiddenException
      // as a fallback when the guard returns false.
      const canActivate = await guard(req, context);
      if (!canActivate) {
        throw new ForbiddenException();
      }
    }
  }
}
