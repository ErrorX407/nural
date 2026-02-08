/**
 * Express Adapter
 * Implements ServerAdapter for Express framework
 */

import express, { Express, Request, Response, RequestHandler } from "express";
import { z } from "zod";
import type { AnyRouteConfig } from "../types/route";
import type { ServerAdapter, StaticRouteResponse } from "./base";
import type { ResolvedErrorHandlerConfig, ErrorContext } from "../types/error";
import { DEFAULT_ERROR_HANDLER_CONFIG } from "../types/error";

/**
 * Express adapter implementation
 */
export class ExpressAdapter implements ServerAdapter {
  public app: Express;
  private errorConfig: ResolvedErrorHandlerConfig;

  constructor(errorConfig?: ResolvedErrorHandlerConfig) {
    this.app = express();
    this.app.use(express.json());
    this.errorConfig = errorConfig ?? DEFAULT_ERROR_HANDLER_CONFIG;
  }

  listen(port: number, cb?: () => void): void {
    this.app.listen(port, cb);
  }

  use(middleware: RequestHandler): void {
    this.app.use(middleware);
  }

  /**
   * Handle errors using the configured error handler
   */
  private async handleError(
    error: Error,
    req: Request,
    res: Response,
    path?: string,
  ): Promise<void> {
    const ctx: ErrorContext = {
      error,
      request: req,
      response: res,
      path: path ?? req.path,
      method: req.method,
    };

    // Log error if enabled
    if (this.errorConfig.logErrors) {
      this.errorConfig.logger(error, ctx);
    }

    try {
      // Get error response from handler
      const errorResponse = await this.errorConfig.handler(ctx);

      // Set headers if provided
      if (errorResponse.headers) {
        Object.entries(errorResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // Include stack in development mode
      const body = { ...errorResponse.body };
      if (this.errorConfig.includeStack && error.stack) {
        body.stack = error.stack;
      }

      res.status(errorResponse.status).json(body);
    } catch (handlerError) {
      // Fallback if error handler itself fails
      console.error("[Nural] Error handler failed:", handlerError);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  registerStaticRoute(
    method: "get",
    path: string,
    handler: (req: Request) => Promise<StaticRouteResponse>,
  ): void {
    this.app[method](path, async (req, res) => {
      try {
        const result = await handler(req);
        if (result.type === "html") {
          res.set("Content-Type", "text/html");
          res.send(result.data);
        } else {
          res.json(result.data);
        }
      } catch (err) {
        await this.handleError(err as Error, req, res, path);
      }
    });
  }

  registerRoute(route: AnyRouteConfig): void {
    const handler: RequestHandler = async (req, res, next) => {
      try {
        // 1. Prepare Base Context
        let context: Record<string, unknown> = { req, res };

        // 2. Run Middleware Pipeline
        if (route.middleware && route.middleware.length > 0) {
          for (const mw of route.middleware) {
            const result = await mw(req, res);
            if (result && typeof result === "object") {
              context = { ...context, ...result };
            }
          }
        }

        // 3. Input Validation
        const params = route.request?.params
          ? await route.request.params.parseAsync(req.params)
          : req.params;

        const query = route.request?.query
          ? await route.request.query.parseAsync(req.query)
          : req.query;

        const body = route.request?.body
          ? await route.request.body.parseAsync(req.body)
          : req.body;

        // 4. Execute Handler
        const result = await route.handler({
          ...context,
          params,
          query,
          body,
          req,
          res,
        });

        // 5. Response Mapping (strips unlisted fields)
        const responses = route.responses ?? {};
        const successCodeKey =
          Object.keys(responses).find((c) => c.startsWith("2")) ?? "200";
        const responseSchema = responses[Number(successCodeKey)];

        if (responseSchema) {
          const cleanResult = await responseSchema.parseAsync(result);
          res.status(Number(successCodeKey)).json(cleanResult);
        } else if (result !== undefined) {
          res.status(Number(successCodeKey)).json(result);
        } else {
          res.status(Number(successCodeKey)).send();
        }
      } catch (err) {
        await this.handleError(err as Error, req, res, route.path);
      }
    };

    // Register route based on HTTP method
    const path = route.path;
    switch (route.method) {
      case "GET":
        this.app.get(path, handler);
        break;
      case "POST":
        this.app.post(path, handler);
        break;
      case "PUT":
        this.app.put(path, handler);
        break;
      case "PATCH":
        this.app.patch(path, handler);
        break;
      case "DELETE":
        this.app.delete(path, handler);
        break;
      case "OPTIONS":
        this.app.options(path, handler);
        break;
      case "HEAD":
        this.app.head(path, handler);
        break;
      case "ALL":
        this.app.all(path, handler);
        break;
    }
  }
}
