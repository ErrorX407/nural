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
import { ModuleConfig } from "./module";

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
  }

  get server() {
    return this.adapter.server;
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
    const { prefix = "", middleware = [], tags = [], security = [], routes } = module;

    routes.forEach((route) => {
      const hydratedRoute = {
        ...route,
        path: this.joinPaths(prefix, route.path),
        middleware: [...middleware, ...(route.middleware || [])],
        tags: [...tags, ...(route.tags || [])],
        security: route.security ? route.security : security,
      };

      this.registerSingleRoute(hydratedRoute);
    });
  }

  /**
   * Register a single route with the adapter and documentation generator
   * @param route The route configuration to register
   */
  private registerSingleRoute(route: AnyRouteConfig): void {
    this.adapter.registerRoute(route);
    if (this.docsConfig.enabled) {
      this.docsGenerator.addRoute(route);
    }
  }

  /**
   * Start the server
   */
  start(port: number): Server {
    if (this.docsConfig.enabled) {
      this.setupDocs();
    }

    return this.adapter.listen(port, () => {
      console.log(`🚀 Nural Server running on port ${port}`);
      if (this.docsConfig.enabled) {
        console.log(
          `📚 Docs available at http://localhost:${port}${this.docsConfig.path}`,
        );
      }
      if (this.corsConfig) {
        console.log(`🔓 CORS enabled`);
      }
      if (this.helmetConfig) {
        console.log(`🛡️  Helmet security headers enabled`);
      }
    });
  }

  private joinPaths(prefix: string, path: string): string {
    const cleanPrefix = prefix.replace(/\/+$/, ""); // Remove trailing slash
    const cleanPath = path.replace(/^\/+/, ""); // Remove leading slash
    return `${cleanPrefix}/${cleanPath}` || "/";
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
