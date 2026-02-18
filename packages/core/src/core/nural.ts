/**
 * Nural Framework
 * Main application class that orchestrates adapters and documentation
 */

import { Server } from "http";
import type { ServerAdapter } from "../adapters/base";
import { ExpressAdapter } from "../adapters/express";
import { FastifyAdapter } from "../adapters/fastify";
import { DocumentationGenerator } from "../docs/generator";
import { applyCorsExpress, applyCorsFastify } from "../middleware/cors";
import { applyHelmetExpress, applyHelmetFastify } from "../middleware/helmet";
import { httpLogger } from "../middleware/http-logger";
import type { NuralConfig, ResolvedDocsConfig } from "../types/config";
import { resolveDocsConfig } from "../types/config";
import type { ResolvedErrorHandlerConfig } from "../types/error";
import { resolveErrorHandlerConfig } from "../types/error";
import type {
  ResolvedCorsConfig,
  ResolvedHelmetConfig,
} from "../types/middleware";
import { resolveCorsConfig, resolveHelmetConfig } from "../types/middleware";
import type { AnyRouteConfig } from "../types/route";
import { Logger } from "./logger";
import { ModuleConfig, ProviderMap } from "./module";

/**
 * Nural - The intelligent, schema-first REST framework
 *
 * @example
 * ```typescript
 * const app = new Nural({
 *   framework: 'express',
 *   docs: true,
 *   cors: true,
 *   helmet: true,
 *   errorHandler: true,
 * });
 * app.register([userRoute, healthRoute]);
 * app.start(3000);
 * ```
 */
export class Nural {
  private adapter: ServerAdapter;
  private docsGenerator: DocumentationGenerator;
  private docsConfig: ResolvedDocsConfig;
  private corsConfig: ResolvedCorsConfig | null;
  private helmetConfig: ResolvedHelmetConfig | null;
  private errorHandlerConfig: ResolvedErrorHandlerConfig;
  private isExpress: boolean;
  public logger: Logger;

  private shutdownHooks: Array<() => Promise<void> | void> = [];
  private isShuttingDown = false;
  private routeRegistry: AnyRouteConfig[] = [];

  constructor(config: NuralConfig = {}) {
    this.docsConfig = resolveDocsConfig(config.docs);
    this.corsConfig = resolveCorsConfig(config.cors);
    this.helmetConfig = resolveHelmetConfig(config.helmet);
    this.errorHandlerConfig = resolveErrorHandlerConfig(config.errorHandler);
    this.docsGenerator = new DocumentationGenerator(this.docsConfig);

    // Initialize System Logger
    this.logger = new Logger("Nural");

    // Select adapter based on framework config
    this.isExpress = config.framework !== "fastify";
    if (this.isExpress) {
      this.adapter = new ExpressAdapter(this.errorHandlerConfig);
    } else {
      this.adapter = new FastifyAdapter(this.errorHandlerConfig);
    }

    // Register HTTP Logger Middleware
    if (config.logger?.enabled !== false) {
      this.adapter.use(
        httpLogger({
          showUserAgent: config.logger?.showUserAgent,
          showTime: config.logger?.showTime ?? true,
        }),
      );
    }

    // Apply built-in middleware
    this.applyBuiltInMiddleware();

    // Automatically bind signal handlers
    this.setupSignalHandlers();
  }

  get server() {
    return this.adapter.server;
  }

  /**
   * Register an infrastructure provider (Database, Redis, etc.)
   * Nural will:
   * 1. Call provider.init() immediately (await it).
   * 2. Automatically call provider.destroy() on shutdown.
   */
  public async registerProvider<T>(provider: import("./provider").NuralProvider<T>): Promise<T> {
    this.logger.info(`Registering provider: ${provider.name}`);
    
    // 1. Initialize
    await provider.init();
    
    // 2. Register Teardown
    this.onShutdown(async () => {
      this.logger.info(`Disconnecting provider: ${provider.name}`);
      await provider.destroy();
    });

    return provider.getInstance();
  }

  /**
   * Register a custom cleanup function
   * Example: Closing WebSocket servers, flushing logs.
   */
  public onShutdown(callback: () => Promise<void> | void) {
    this.shutdownHooks.push(callback);
  }

  /**
   * 🛑 The Graceful Shutdown Orchestrator
   */
  public async close() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    // Use console.error to bypass stdout buffering during shutdown
    console.error("\n🛑 Shutting down gracefully...");

    // 1. Stop accepting new HTTP requests
    if (this.server) {
      // Create a promise that resolves when the server closes
      await new Promise<void>((resolve) => {
        this.server?.close((err) => {
             if (err) console.error("Error closing server:", err);
             resolve();
        });
      });
      console.error("❌ HTTP Server closed");
    }

    // 2. Execute all shutdown hooks (Reverse order: LIFO)
    for (const hook of this.shutdownHooks.reverse()) {
      try {
        await hook();
      } catch (err) {
        console.error("Error during shutdown hook", err instanceof Error ? err.message : String(err));
      }
    }

    console.error("👋 Goodbye!");
    
    // Give a small delay for logs to flush before exiting
    setTimeout(() => process.exit(0), 100);
  }

  private setupSignalHandlers() {
    // Only bind once
    if (process.listenerCount("SIGINT") > 0) return;

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];
    
    signals.forEach((signal) => {
      process.on(signal, () => {
        if (this.isShuttingDown) return;
        console.error(`\nReceived ${signal}`);
        this.close();
      });
    });
  }



  /**
   * Start the server
   */
  public async start(port: number): Promise<Server> {
    if (this.docsConfig.enabled) {
      this.setupDocs();
    }

    return new Promise((resolve) => {
      const server = this.adapter.listen(port, () => {
        this.logger.log(`🚀 Nural Server running on port ${port}`);
        if (this.docsConfig.enabled) {
          this.logger.log(
            `📚 Docs available at http://localhost:${port}${this.docsConfig.path}`,
          );
        }
        if (this.corsConfig) {
          this.logger.log(`🔓 CORS enabled`);
        }
        if (this.helmetConfig) {
          this.logger.log(`🛡️  Helmet security headers enabled`);
        }
        resolve(server);
      });
    });
  }
  /**
   * Apply CORS and Helmet middleware based on config
   */
  private applyBuiltInMiddleware(): void {
    const app = this.adapter.app;

    if (this.isExpress) {
      // Apply Helmet first (security headers)
      if (this.helmetConfig) {
        applyHelmetExpress(app, this.helmetConfig);
      }
      // Apply CORS
      if (this.corsConfig) {
        applyCorsExpress(app, this.corsConfig);
      }
    } else {
      // Fastify
      if (this.helmetConfig) {
        applyHelmetFastify(app, this.helmetConfig);
      }
      if (this.corsConfig) {
        applyCorsFastify(app, this.corsConfig);
      }
    }
  }

  /**
   * Register routes with the application
   */
  register(routes: AnyRouteConfig[]): void {
    routes.forEach((route) => {
      this.adapter.registerRoute(route);
      if (this.docsConfig.enabled) {
        this.docsGenerator.addRoute(route);
      }
    });
  }

  /**
   * Register a module containing multiple routes with shared configuration
   * @param module The module configuration to register
   */
  registerModule(module: ModuleConfig): void {
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

    routes.forEach((route) => {
      const originalHandler = route.handler;
      const routeProviders = route.inject || {};

      const wrappedHandler = async (ctx: any) => {
        // 0. Create Execution Context
        const context = {
          req: ctx.req,
          meta: route.meta || {},
          handlerName: originalHandler.name || "anonymous"
        };
        
        try {
          const flattenedContext = {
            ...ctx,
            // 1. Route Defaults (inject)
            // 2. Module Overrides (providers) -> Overrides Route defaults (Good for Mocking!)
            ...routeProviders,
            ...moduleProviders
          };

          // 1. Run Guards
          if (route.guards) {
            for (const guard of route.guards) {
              const canActivate = await guard(ctx.req, context);
              if (!canActivate) {
                const error = new Error("Forbidden resource");
                (error as any).statusCode = 403;
                throw error;
              }
            }
          }

          // 2. Run Interceptors (Pre-Controller)
          // We define a recursive runner to handle the "onion" architecture
          const runInterceptors = async (index: number): Promise<any> => {
            if (!route.interceptors || index >= route.interceptors.length) {
               return originalHandler(flattenedContext); // Base case: call handler
            }
            
            const interceptor = route.interceptors[index];
            return interceptor(ctx.req, () => runInterceptors(index + 1), context);
          };

          return await runInterceptors(0);

        } catch (error) {
           // 3. Run Exception Filters
           if (route.filters) {
             for (const filter of route.filters) {
               await filter(error, ctx.req, ctx.res, context);
               if (ctx.res.headersSent) return; // Stop if filter handled it
             }
           }
           throw error; // Rethrow to global handler if not handled
        }
      };

      const hydratedRoute = {
        ...route,
        path: this.joinPaths(prefix, route.path),
        middleware: [...middleware, ...(route.middleware || [])],
        tags: [...tags, ...(route.tags || [])],
        security: route.security ? route.security : security,
        handler: wrappedHandler
      };

      this.registerSingleRoute(hydratedRoute);
    });
  }

  /**
   * Register a single route with the adapter and documentation generator
   * @param route The route configuration to register
   */
  private registerSingleRoute(route: AnyRouteConfig): void {
    this.routeRegistry.push(route);

    this.adapter.registerRoute(route);
    if (this.docsConfig.enabled) {
      this.docsGenerator.addRoute(route);
    }
  }


  private joinPaths(prefix: string, path: string): string {
    const cleanPrefix = prefix.replace(/\/+$/, ""); // Remove trailing slash
    const cleanPath = path.replace(/^\/+/, ""); // Remove leading slash
    return `${cleanPrefix}/${cleanPath}` || "/";
  }

  /**
   * Public accessor for the CLI
   */
  public getRoutes(): AnyRouteConfig[] {
    return this.routeRegistry;
  }

  /**
   * Programmatic access to OpenAPI Spec
   * This allows the CLI to generate docs without starting the server.
   */
  public getOpenApiSpec(): Record<string, any> {
    if (!this.docsConfig.enabled) {
      throw new Error("Documentation is disabled in Nural configuration.");
    }
    return this.docsGenerator.generateSpec();
  }

  /**
   * Setup documentation routes
   */
  private setupDocs(): void {
    const specPath = `${this.docsConfig.path}/openapi.json`;

    this.adapter.registerStaticRoute("get", specPath, async () => {
      return { type: "json", data: this.docsGenerator.generateSpec() };
    });

    this.adapter.registerStaticRoute("get", this.docsConfig.path, async () => {
      const html =
        this.docsConfig.ui === "swagger"
          ? this.docsGenerator.getSwaggerHtml(specPath)
          : this.docsGenerator.getScalarHtml(specPath);

      return {
        type: "html",
        data: html,
      };
    });
  }
}
