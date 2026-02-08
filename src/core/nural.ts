/**
 * Nural Framework
 * Main application class that orchestrates adapters and documentation
 */

import type { ServerAdapter } from "../adapters/base";
import { ExpressAdapter } from "../adapters/express";
import { FastifyAdapter } from "../adapters/fastify";
import type { AnyRouteConfig } from "../types/route";
import type { NuralConfig, ResolvedDocsConfig } from "../types/config";
import { resolveDocsConfig } from "../types/config";
import type {
  ResolvedCorsConfig,
  ResolvedHelmetConfig,
} from "../types/middleware";
import { resolveCorsConfig, resolveHelmetConfig } from "../types/middleware";
import type { ResolvedErrorHandlerConfig } from "../types/error";
import { resolveErrorHandlerConfig } from "../types/error";
import { DocumentationGenerator } from "../docs/generator";
import { applyCorsExpress, applyCorsFastify } from "../middleware/cors";
import { applyHelmetExpress, applyHelmetFastify } from "../middleware/helmet";
import { Logger } from "./logger";
import { httpLogger } from "../middleware/http-logger";

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
   * Start the server
   */
  start(port: number): void {
    if (this.docsConfig.enabled) {
      this.setupDocs();
    }

    this.adapter.listen(port, () => {
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

  /**
   * Setup documentation routes
   */
  private setupDocs(): void {
    const specPath = `${this.docsConfig.path}/openapi.json`;

    this.adapter.registerStaticRoute("get", specPath, async () => {
      return { type: "json", data: this.docsGenerator.generateSpec() };
    });

    this.adapter.registerStaticRoute("get", this.docsConfig.path, async () => {
      return {
        type: "html",
        data: this.docsGenerator.getScalarHtml(specPath),
      };
    });
  }
}
