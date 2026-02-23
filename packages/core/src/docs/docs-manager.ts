
import { DocumentationGenerator } from "./openapi.generator";
import { resolveDocsConfig } from "../common/config.types";
import { ResolvedDocsConfig, DocsConfig } from "../common/config.types";
import { AnyRouteConfig } from "../router/route-storage.types";
import { ServerAdapter } from "../adapters/server-adapter.interface";
import { Logger } from "../common/logger.provider";

export class DocsManager {
  private generator: DocumentationGenerator;
  private config: ResolvedDocsConfig;
  private logger = new Logger("DocsManager");

  constructor(config?: boolean | DocsConfig) {
    this.config = resolveDocsConfig(config);
    this.generator = new DocumentationGenerator(this.config);
  }

  public get enabled(): boolean {
    return this.config.enabled;
  }

  public get path(): string {
    return this.config.path;
  }

  public addRoute(route: AnyRouteConfig) {
    if (this.enabled) {
      this.generator.addRoute(route);
    }
  }

  public generateSpec(): Record<string, any> {
    if (!this.enabled) {
      throw new Error("Documentation is disabled.");
    }
    return this.generator.generateSpec() as Record<string, any>;
  }

  public setup(adapter: ServerAdapter) {
    if (!this.enabled) return;

    const specPath = `${this.config.path}/openapi.json`;

    // Register JSON Spec Route
    adapter.registerStaticRoute("get", specPath, async () => {
      return { type: "json", data: this.generateSpec() };
    });

    // Register UI Route
    adapter.registerStaticRoute("get", this.config.path, async () => {
      const html = this.config.ui === "swagger"
        ? this.generator.getSwaggerHtml(specPath)
        : this.generator.getScalarHtml(specPath);
      return { type: "html", data: html };
    });

    this.logger.log(`📚 Docs available at ${this.config.path}`);
  }
}
