/**
 * Documentation Generator
 * Generates OpenAPI spec and serves documentation UI
 */

import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import type { z } from "zod";
import type { AnyRouteConfig } from "../router/route-storage.types";
import type { ResolvedDocsConfig } from "../common/config.types";

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
      security: route.security,
      ...route.openapi,
    });
  }

  /**
   * Generate the OpenAPI specification document
   */
  generateSpec(): object {
    const generator = new OpenApiGeneratorV3(this.registry.definitions);
    const doc = generator.generateDocument({
      openapi: "3.0.0",
      info: {
        title: this.config.openApi.info?.title ?? "Nural API",
        version: this.config.openApi.info?.version ?? "1.0.0",
        description: this.config.openApi.info?.description,
        termsOfService: this.config.openApi.info?.termsOfService,
        contact: this.config.openApi.info?.contact?.name
          ? {
              name: this.config.openApi.info.contact.name,
              email: this.config.openApi.info.contact.email,
              url: this.config.openApi.info.contact.url,
            }
          : undefined,
        license: this.config.openApi.info?.license?.name
          ? {
              name: this.config.openApi.info.license.name,
              url: this.config.openApi.info.license.url,
            }
          : undefined,
      },
      servers: this.config.openApi.servers,
    });

    // Deep merge user-defined OpenAPI overrides
    return {
      ...doc,
      components: {
        ...doc.components,
        ...this.config.openApi.components,
        securitySchemes: {
          ...doc.components?.securitySchemes,
          ...this.config.openApi.components?.securitySchemes,
        },
      },
      security: [
        ...(doc.security || []),
        ...(this.config.openApi.security || []),
      ],
      tags: [...(doc.tags || []), ...(this.config.openApi.tags || [])],
      externalDocs: this.config.openApi.externalDocs || doc.externalDocs,
    };
  }

  /**
   * Get Scalar API documentation HTML
   */
  getScalarHtml(specUrl: string): string {
    const scalarConfig = JSON.stringify(this.config.scalar || {});
    return `
      <!doctype html>
      <html>
        <head>
          <title>${this.config.openApi.info?.title ?? "Nural API"} - API Reference</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>body { margin: 0; }</style>
        </head>
        <body>
          <script
            id="api-reference"
            data-url="${specUrl}"
            data-configuration='${scalarConfig}'
            src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
          ></script>
        </body>
      </html>
    `;
  }

  /**
   * Get Swagger UI HTML
   */
  getSwaggerHtml(specUrl: string): string {
    const title = this.config.openApi.info?.title ?? "Nural API";
    const swaggerOptions = JSON.stringify(this.config.swagger.options || {});
    let themeUrl =
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";

    if (this.config.swagger.theme === "outline") {
      themeUrl =
        "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";
    } else if (this.config.swagger.theme === "no-theme") {
      themeUrl = "";
    }

    const theme = themeUrl
      ? `<link rel="stylesheet" href="${themeUrl}" />`
      : "";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title} - Swagger UI</title>
        ${theme}
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin: 0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: "${specUrl}",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            ...${swaggerOptions}
          })
          window.ui = ui
        }
        </script>
      </body>
      </html>
    `;
  }
}
