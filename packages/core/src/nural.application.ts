
/**
 * Nural Framework
 * Main application class (Orchestrator)
 */

import { Server } from "http";
import { AdapterFactory } from "./adapters/adapter-factory";

import { ResolvedErrorHandlerConfig, resolveErrorHandlerConfig } from "./exceptions/error-handler.provider";
import type { AnyRouteConfig } from "./router/route-storage.types";
import type {
  ResolvedCorsConfig,
  ResolvedHelmetConfig,
} from "./pipeline/middleware/middleware-config";
import { resolveCorsConfig, resolveHelmetConfig } from "./pipeline/middleware/middleware-config";
import { httpLogger } from "./pipeline/middleware/http-logger.middleware";
import { Logger } from "./common/logger.provider";
import { CronService } from "./common/cron.service";
import { SocketIoAdapter } from "./adapters";
import { GatewayBuilder, GatewayConfig } from "./common/websocket.types";

import { ShutdownManager } from "./lifecycle/shutdown-manager";
import { BootManager } from "./lifecycle/boot-manager";
import { PipelineManager } from "./pipeline/pipeline-manager";
import { ProviderContainer } from "./lifecycle/provider-container";
import { NuralProvider } from "./lifecycle/provider-container";
import { ModuleConfig } from "./router/module.factory";
import { CronJobConfig } from "./common/cron.types";
import { DocsManager } from "./docs/docs-manager";
import { ServerAdapter } from "./adapters/server-adapter.interface";
import { NuralConfig } from "./common/config.types";

/**
 * Nural - The intelligent, schema-first REST framework
 */
export class Nural {
  private adapter: ServerAdapter;
  private corsConfig: ResolvedCorsConfig | null;
  private helmetConfig: ResolvedHelmetConfig | null;
  private errorHandlerConfig: ResolvedErrorHandlerConfig;
  private isExpress: boolean;
  public logger: Logger;
  private cronService: CronService;
  private socketAdapter: SocketIoAdapter;

  // Managers
  private shutdownManager: ShutdownManager;
  private bootManager: BootManager;
  private pipelineManager: PipelineManager;
  private providerContainer: ProviderContainer;
  private docsManager: DocsManager;

  private routeRegistry: AnyRouteConfig[] = [];

  constructor(config: NuralConfig = {}) {
    // 1. Initialize ShutdownManager first (needed for cleanup hooks)
    this.shutdownManager = new ShutdownManager();

    // 2. Configure Global File Transport (BEFORE creating Logger instance)
    if (config.logger?.file?.enabled) {
      Logger.setFileTransport(config.logger.file);
      this.shutdownManager.onShutdown(async () => {
        Logger.fileTransport?.close();
      });
    }

    // 3. Initialize Logger (will pick up the global FileTransport)
    this.logger = new Logger("Nural", config.logger);

    // Config Resolution
    this.corsConfig = resolveCorsConfig(config.cors);
    this.helmetConfig = resolveHelmetConfig(config.helmet);
    this.errorHandlerConfig = resolveErrorHandlerConfig(config.errorHandler);

    // Initialize other Managers
    this.bootManager = new BootManager();
    this.pipelineManager = new PipelineManager();
    this.providerContainer = new ProviderContainer(this.logger); // Logger is now safe
    this.docsManager = new DocsManager(config.docs);



    this.cronService = new CronService();
    this.socketAdapter = new SocketIoAdapter();

    // Select adapter based on framework config
    this.isExpress = config.framework !== "fastify";
    this.adapter = AdapterFactory.create(
      config.framework || "express",
      this.errorHandlerConfig
    );

    // Register HTTP Logger Middleware
    if (config.logger?.enabled !== false) {
      this.adapter.use(
        httpLogger({
          config: config.logger,
        }),
      );
    }

    // Apply built-in middleware
    this.pipelineManager.applyBuiltInMiddleware(
      this.adapter,
      this.isExpress,
      this.corsConfig,
      this.helmetConfig
    );

    // Bind signal handlers
    this.shutdownManager.setupSignalHandlers(() => this.close());
  }

  get server() {
    return this.adapter.server;
  }

  /**
   * Register an infrastructure provider
   */
  public async registerProvider<T>(provider: NuralProvider<T>): Promise<T> {
    const instance = await this.providerContainer.register(provider);
    return instance;
  }

  /**
   * Register a custom cleanup function
   */
  public onShutdown(callback: () => Promise<void> | void) {
    this.shutdownManager.onShutdown(callback);
  }

  /**
   * Graceful Shutdown
   */
  public async close() {
    await this.shutdownManager.execute(
      this.server,
      this.cronService,
      this.socketAdapter,
      this.providerContainer
    );
  }

  /**
   * Register a scheduled Cron Job
   */
  public registerCron(config: CronJobConfig): void {
    this.cronService.addJob(config);
  }

  /**
   * Register a WebSocket Gateway
   */
  public registerGateway(gateway: GatewayConfig<any, any> | GatewayBuilder<any, any>): void {
    this.socketAdapter.register(gateway);
  }

  /**
   * Start the server
   */
  public async start(port: number): Promise<Server> {
    const server = await this.bootManager.start({
      port,
      adapter: this.adapter,
      socketAdapter: this.socketAdapter,
      docsManager: this.docsManager,
      logger: this.logger,
      corsConfig: this.corsConfig,
      helmetConfig: this.helmetConfig
    });

    // 🟢 TRACK CONNECTIONS for Graceful Shutdown
    this.shutdownManager.trackConnections(server);

    return server;
  }

  register(routes: AnyRouteConfig[]): void {
    routes.forEach((route) => this.registerSingleRoute(route));
  }

  registerModule(module: ModuleConfig): void {
    const routes = this.pipelineManager.routesResolver.resolveModule(module);
    routes.forEach(route => this.registerSingleRoute(route));
  }

  private registerSingleRoute(route: AnyRouteConfig): void {
    this.routeRegistry.push(route);
    this.adapter.registerRoute(route);
    this.docsManager.addRoute(route);
  }

  public getRoutes(): AnyRouteConfig[] {
    return this.routeRegistry;
  }

  public getOpenApiSpec(): Record<string, any> {
    return this.docsManager.generateSpec();
  }
}
