import { Server } from "socket.io";
import { Logger } from "../core/logger";
import { GatewayBuilder, GatewayConfig } from "../types";

export class SocketIoAdapter {
  private io: Server | null = null;
  private logger = new Logger("SocketIoAdapter");
  private gateways: GatewayConfig<any>[] = [];

  public attach(server: any) {
    this.io = new Server(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    this.gateways.forEach(g => this.bindGateway(g));
  }

  /** Accepts either a raw GatewayConfig or a GatewayBuilder instance */
  public register(gateway: GatewayConfig<any> | GatewayBuilder<any>) {
    const config = gateway instanceof GatewayBuilder
      ? gateway.getConfig()
      : gateway;

    this.gateways.push(config);
    if (this.io) this.bindGateway(config);
  }

  public close() {
    this.io?.close();
    this.logger.info("Socket.io server closed");
  }

  private bindGateway(gateway: GatewayConfig<any>) {
    if (!this.io) return;

    const nsp = this.io.of(gateway.namespace || "/");
    const services = gateway.inject || {};

    if (gateway.middleware) {
      gateway.middleware.forEach((fn) => {
        nsp.use(async (socket, next) => {
          try {
            // Inject services into middleware (e.g. AuthService)
            await fn(socket, services);
            next();
          } catch (err: any) {
            // Reject connection
            next(new Error(err.message || "Unauthorized"));
          }
        });
      });
    }

    this.logger.info(`Binding gateway: ${gateway.namespace || "/"}`);

    nsp.on("connection", (socket) => {
      try { gateway.onConnect?.(socket, services); }
      catch (err) { this.logger.error(`onConnect error`, err); }

      gateway.events.forEach((eventConfig) => {
        socket.on(eventConfig.event, async (rawData: any, callback?: any) => {
          try {
            let validMessage = rawData;

            if (eventConfig.payload) {
              const result = eventConfig.payload.safeParse(rawData);
              if (!result.success) {
                return typeof callback === "function"
                  ? callback({ status: "error", error: "Validation Failed", details: result.error.errors })
                  : undefined;
              }
              validMessage = result.data;
            }

            const result = await eventConfig.handler({
              client: socket,
              message: validMessage,
              ...services,
            });

            if (typeof callback === "function") callback({ status: "ok", data: result });

          } catch (err: any) {
            this.logger.error(`Event error: ${eventConfig.event}`, err);
            if (typeof callback === "function") callback({ status: "error", error: err.message });
          }
        });
      });

      socket.on("disconnect", () => {
        try { gateway.onDisconnect?.(socket, services); }
        catch (err) { this.logger.error(`onDisconnect error`, err); }
      });
    });
  }
}