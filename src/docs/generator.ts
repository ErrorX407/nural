/**
 * Documentation Generator
 * Generates OpenAPI spec and serves documentation UI
 */

import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import type { z } from "zod";
import type { AnyRouteConfig } from "../types/route";
import type { ResolvedDocsConfig } from "../types/config";

/**
 * Generates OpenAPI documentation from registered routes
 */
export class DocumentationGenerator {
  private registry: OpenAPIRegistry;
  private config: ResolvedDocsConfig;

  constructor(config: ResolvedDocsConfig) {
    this.registry = new OpenAPIRegistry();
    this.config = config;
  }

  /**
   * Register a route for documentation
   */
  addRoute(route: AnyRouteConfig): void {
    // Convert Express path "/users/:id" to OpenAPI path "/users/{id}"
    const openApiPath = route.path.replace(/:([a-zA-Z]+)/g, "{$1}");

    const method = route.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch";

    this.registry.registerPath({
      method,
      path: openApiPath,
      summary: route.summary || "No summary",
      description: route.description,
      tags: route.tags,
      request: {
        params: route.request?.params as z.ZodObject<any, any>,
        query: route.request?.query as z.ZodObject<any, any>,
        body: route.request?.body
          ? { content: { "application/json": { schema: route.request.body } } }
          : undefined,
      },
      responses: Object.fromEntries(
        Object.entries(route.responses || {}).map(([status, schema]) => [
          status,
          {
            description: "Response",
            content: { "application/json": { schema } },
          },
        ]),
      ),
    });
  }

  /**
   * Generate the OpenAPI specification document
   */
  generateSpec(): object {
    const generator = new OpenApiGeneratorV3(this.registry.definitions);
    return generator.generateDocument({
      openapi: "3.0.0",
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
      },
      servers: [{ url: "/" }],
    });
  }

  /**
   * Get Scalar API documentation HTML
   */
  getScalarHtml(specUrl: string): string {
    return `
      <!doctype html>
      <html>
        <head>
          <title>${this.config.title} - API Reference</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>body { margin: 0; }</style>
        </head>
        <body>
          <script
            id="api-reference"
            data-url="${specUrl}"
            src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
          ></script>
        </body>
      </html>
    `;
  }
}
