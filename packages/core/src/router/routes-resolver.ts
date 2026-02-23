
import { ModuleConfig } from "./module.factory";
import { AnyRouteConfig } from "./route-storage.types";
import { GuardsConsumer } from "../pipeline/guards-consumer";
import { InterceptorsConsumer } from "../pipeline/interceptors-consumer";
import { ExceptionFiltersConsumer } from "../exceptions/exception-filters-consumer";
import { ExecutionContextHost } from "../pipeline/execution-context-host";

export class RoutesResolver {
  constructor(
    private readonly guardsConsumer: GuardsConsumer,
    private readonly interceptorsConsumer: InterceptorsConsumer,
    private readonly exceptionFiltersConsumer: ExceptionFiltersConsumer
  ) { }

  public resolveModule(module: ModuleConfig): AnyRouteConfig[] {
    const {
      prefix = "",
      middleware = [],
      tags = [],
      security = [],
      providers: moduleProviders = {},
      routes
    } = module;

    // Safety Check: Don't let users overwrite core properties
    const reservedKeys = ['req', 'res', 'body', 'query', 'params', 'next'];
    Object.keys(moduleProviders).forEach(key => {
      if (reservedKeys.includes(key)) {
        throw new Error(`Dependency Injection Error: Provider name "${key}" is reserved. Rename it.`);
      }
    });

    return routes.map((route) => {
      const originalHandler = route.handler;
      const routeProviders = route.inject || {};

      const wrappedHandler = async (ctx: { req: unknown; res: unknown;[key: string]: unknown }) => {
        // 0. Create Execution Context
        const context = new ExecutionContextHost(
          [ctx.req, ctx.res],
          null, // Constructor Ref
          originalHandler as unknown as ((...args: unknown[]) => unknown),
          'http',
          route.meta || {}
        );
        context.setHandlerName(originalHandler.name || "anonymous");

        try {
          const flattenedContext = {
            ...ctx,
            // 1. Route Defaults (inject)
            // 2. Module Overrides (providers) -> Overrides Route defaults (Good for Mocking!)
            ...routeProviders,
            ...moduleProviders
          };

          // Attach flattenedContext properties to the ExecutionContext so Guards/Interceptors can read them
          Object.assign(context, flattenedContext);

          // 1. Run Guards
          await this.guardsConsumer.tryActivate(route.guards || [], ctx.req, context);

          // 2. Run Interceptors (Pre-Controller)
          // The consumer handles the recursion and logic
          return await this.interceptorsConsumer.intercept(
            route.interceptors || [],
            ctx.req,
            context,
            () => originalHandler(flattenedContext as Parameters<typeof originalHandler>[0])
          );

        } catch (error) {
          // 3. Run Exception Filters
          const handled = await this.exceptionFiltersConsumer.apply(
            route.filters || [],
            error,
            ctx.req,
            ctx.res,
            context
          );

          if (handled) return;

          throw error; // Rethrow to global handler if not handled
        }
      };

      return {
        ...route,
        path: this.joinPaths(prefix, route.path),
        middleware: [...middleware, ...(route.middleware || [])].filter((mw): mw is typeof mw => typeof mw === 'function'),
        tags: [...tags, ...(route.tags || [])],
        security: route.security ? route.security : security,
        handler: wrappedHandler
      };
    });
  }

  private joinPaths(prefix: string, path: string): string {
    const cleanPrefix = prefix.replace(/\/+$/, ""); // Remove trailing slash
    const cleanPath = path.replace(/^\/+/, ""); // Remove leading slash
    return `${cleanPrefix}/${cleanPath}` || "/";
  }
}
