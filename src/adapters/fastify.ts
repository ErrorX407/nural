/**
 * Fastify Adapter
 * Implements ServerAdapter for Fastify framework
 */

import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  HTTPMethods,
  FastifyPluginCallback,
} from "fastify";
import { z } from "zod";
import type { AnyRouteConfig } from "../types/route";
import type { ServerAdapter, StaticRouteResponse } from "./base";
import type { ResolvedErrorHandlerConfig, ErrorContext } from "../types/error";
import { DEFAULT_ERROR_HANDLER_CONFIG } from "../types/error";

/**
 * Fastify adapter implementation
 */
export class FastifyAdapter implements ServerAdapter {
  public app: FastifyInstance;
  private errorConfig: ResolvedErrorHandlerConfig;

  constructor(errorConfig?: ResolvedErrorHandlerConfig) {
    this.app = Fastify();
    this.errorConfig = errorConfig ?? DEFAULT_ERROR_HANDLER_CONFIG;
  }

  listen(port: number, cb?: () => void): void {
    this.app.listen({ port }, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      if (cb) cb();
    });
  }

  use(middleware: FastifyPluginCallback): void {
    this.app.register(middleware);
  }

  /**
   * Handle errors using the configured error handler
   */
  private async handleError(
    error: Error,
    req: FastifyRequest,
    reply: FastifyReply,
    path?: string,
  ): Promise<void> {
    const ctx: ErrorContext = {
      error,
      request: req,
      response: reply,
      path: path ?? req.url,
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
          reply.header(key, value);
        });
      }

      // Include stack in development mode
      const body = { ...errorResponse.body };
      if (this.errorConfig.includeStack && error.stack) {
        body.stack = error.stack;
      }

      reply.status(errorResponse.status).send(body);
    } catch (handlerError) {
      // Fallback if error handler itself fails
      console.error("[Nural] Error handler failed:", handlerError);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  }

  registerStaticRoute(
    method: "get",
    path: string,
    handler: (req: unknown) => Promise<StaticRouteResponse>,
  ): void {
    this.app.get(path, async (req, reply) => {
      try {
        const result = await handler(req);
        if (result.type === "html") {
          reply.type("text/html").send(result.data);
        } else {
          reply.send(result.data);
        }
      } catch (err) {
        await this.handleError(err as Error, req, reply, path);
      }
    });
  }

  registerRoute(route: AnyRouteConfig): void {
    const url = route.path;

    this.app.route({
      method: route.method as HTTPMethods,
      url,
      handler: async (req: FastifyRequest, reply: FastifyReply) => {
        try {
          // 1. Prepare Context
          let context: Record<string, unknown> = { req, res: reply };

          // 2. Run Middleware Pipeline
          if (route.middleware && route.middleware.length > 0) {
            for (const mw of route.middleware) {
              const result = await mw(req, reply);
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
            res: reply,
          });

          // 5. Response Mapping
          const responses = route.responses ?? {};
          const successCodeKey =
            Object.keys(responses).find((c) => c.startsWith("2")) ?? "200";
          const responseSchema = responses[Number(successCodeKey)];

          if (responseSchema) {
            const cleanResult = await responseSchema.parseAsync(result);
            reply.status(Number(successCodeKey)).send(cleanResult);
          } else if (result !== undefined) {
            reply.status(Number(successCodeKey)).send(result);
          } else {
            reply.status(Number(successCodeKey)).send();
          }
        } catch (err) {
          await this.handleError(err as Error, req, reply, route.path);
        }
      },
    });
  }
}
