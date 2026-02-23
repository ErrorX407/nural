
import { Logger } from "../common/logger.provider";
import { ServerAdapter } from "../adapters/server-adapter.interface";
import { SocketIoAdapter } from "../adapters";
import { DocsManager } from "../docs/docs-manager";
import { ResolvedCorsConfig, ResolvedHelmetConfig } from "../pipeline/middleware/middleware-config";
import { Server } from "http";

export interface BootOptions {
  port: number;
  adapter: ServerAdapter;
  socketAdapter: SocketIoAdapter;
  docsManager: DocsManager;
  logger: Logger;
  corsConfig: ResolvedCorsConfig | null;
  helmetConfig: ResolvedHelmetConfig | null;
}

export class BootManager {
  private logger = new Logger("BootManager");

  public async start(options: BootOptions): Promise<Server> {
    const { port, adapter, socketAdapter, docsManager, logger, corsConfig, helmetConfig } = options;

    logger.info("Starting Nural Application...");

    // Future: Add any pre-boot checks here

    // Setup Docs
    docsManager.setup(adapter);

    // 🟢 ATTACH Socket.io BEFORE listen
    socketAdapter.attach(adapter.server);

    return new Promise((resolve) => {
      adapter.listen(port, () => {
        logger.log(`🚀 Nural Server running on port ${port}`);

        if (corsConfig) {
          logger.log(`🔓 CORS enabled`);
        }
        if (helmetConfig) {
          logger.log(`🛡️  Helmet security headers enabled`);
        }
        resolve(adapter.server as Server);
      });
    });
  }
}
