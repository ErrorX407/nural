
import { Logger } from "../common/logger.provider";
import { CronService } from "../common/cron.service";
import { SocketIoAdapter } from "../adapters";
import { ProviderContainer } from "./provider-container";
import { Server } from "http";
import { Socket } from "net";

export class ShutdownManager {
  private shutdownHooks: Array<() => Promise<void> | void> = [];
  private isShuttingDown = false;
  private logger = new Logger("ShutdownManager");
  private activeConnections = new Set<Socket>();

  public onShutdown(callback: () => Promise<void> | void) {
    this.shutdownHooks.push(callback);
  }

  public trackConnections(server: Server) {
    server.on('connection', (socket) => {
      this.activeConnections.add(socket);
      socket.on('close', () => {
        this.activeConnections.delete(socket);
      });
    });
  }

  public async execute(
    server: Server | undefined,
    cronService: CronService,
    socketAdapter: SocketIoAdapter,
    providerContainer: ProviderContainer
  ) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.warn("\n🛑 Shutting down gracefully...");

    // 🔴 1. The Failsafe Timeout
    const killTimer = setTimeout(() => {
      this.logger.error("⚠️ Shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10000);

    // 1. Stop Cron Jobs & WebSockets (No new automated/socket tasks)
    if (cronService) {
      cronService.stopAll();
    }
    if (socketAdapter) {
      socketAdapter.close();
    }

    // 2. Stop accepting new HTTP requests & Destroy dangling sockets
    if (server) {
      server.close((err: Error | undefined) => {
        if (err) this.logger.error("Error closing server:", err);
      });

      // Force close all existing lingering connections (Keep-Alive/WebSockets)
      for (const socket of this.activeConnections) {
        socket.destroy();
      }
      this.activeConnections.clear();
      this.logger.warn("❌ HTTP Server closed & Connections drained");
    }

    // 3. Destroy Providers (Cleanly close DBs)
    await providerContainer.destroyAll();

    // 4. Execute all remaining shutdown hooks (Reverse order: LIFO, closes Logger last)
    for (const hook of this.shutdownHooks.reverse()) {
      try {
        await hook();
      } catch (err) {
        this.logger.error("Error during shutdown hook", err instanceof Error ? err.message : String(err));
      }
    }

    this.logger.warn("👋 Goodbye!");
    clearTimeout(killTimer);

    // Give a small delay for logs to flush before exiting
    setTimeout(() => process.exit(0), 100);
  }

  public setupSignalHandlers(callback: () => void) {
    if (typeof process !== 'undefined' && process.listenerCount && process.listenerCount("SIGINT") > 0) return;

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];
    signals.forEach((signal) => {
      process.on(signal, () => {
        if (this.isShuttingDown) return;
        this.logger.warn(`\nReceived ${signal}`);
        callback();
      });
    });
  }
}
