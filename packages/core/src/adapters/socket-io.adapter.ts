import { Server } from "socket.io";
import { GatewayConfig } from "../types/websocket";
import { Logger } from "../core/logger";

/**
 * Adapter to manage Socket.io Gateways
 */
export class SocketIoAdapter {
  private io: Server | null = null;
  private logger = new Logger("SocketIoAdapter");
  private gateways: GatewayConfig<any>[] = [];

  constructor() {}

  /**
   * Attach to an HTTP server
   */
  public attach(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    
    // Initialize pending gateways
    this.gateways.forEach(gateway => this.bindGateway(gateway));
  }

  /**
   * Register a gateway configuration
   */
  public register(gateway: GatewayConfig<any>) {
    this.gateways.push(gateway);
    if (this.io) {
      this.bindGateway(gateway);
    }
  }

  /**
   * Close the socket server
   */
  public close() {
    if (this.io) {
      this.io.close();
      this.logger.info("Socket.io server closed");
    }
  }

  /**
   * Bind a single gateway to a namespace
   */
  private bindGateway(gateway: GatewayConfig<any>) {
    if (!this.io) return;

    const nsp = this.io.of(gateway.namespace || "/");
    const services = gateway.inject || {};

    this.logger.info(`Binding gateway to namespace: ${gateway.namespace || "/"}`);

    nsp.on("connection", (socket) => {
      // 1. Lifecycle: onConnect
      if (gateway.onConnect) {
        try {
          gateway.onConnect(socket, services);
        } catch (err) {
          this.logger.error(`Error in onConnect for ${gateway.namespace}`, err);
        }
      }

      // 2. Bind Events
      gateway.events.forEach((eventConfig) => {
        socket.on(eventConfig.event, async (rawData: any, callback?: any) => {
          try {
            // A. Validate Data (Zod)
            let validData = rawData;
            if (eventConfig.schema) {
              const result = eventConfig.schema.safeParse(rawData);
              if (!result.success) {
                // Validation Error
                 if (callback && typeof callback === 'function') {
                    return callback({
                        status: 'error',
                        error: 'Validation Failed',
                        details: result.error.errors
                    });
                 }
                 return; // Stop execution
              }
              validData = result.data;
            }

            // B. Execute Handler with Context (DI)
            const context = {
              client: socket,
              data: validData,
              ...services,
            };

            const result = await eventConfig.handler(context);

            // C. Acknowledgement
            if (callback && typeof callback === 'function') {
               callback({ status: 'ok', data: result });
            }

          } catch (err: any) {
            this.logger.error(`Error handling event '${eventConfig.event}'`, err);
             if (callback && typeof callback === 'function') {
                callback({ status: 'error', error: err.message || 'Internal Server Error' });
             }
          }
        });
      });

      // 3. Lifecycle: onDisconnect
      socket.on("disconnect", () => {
        if (gateway.onDisconnect) {
          try {
             gateway.onDisconnect(socket, services);
          } catch (err) {
             this.logger.error(`Error in onDisconnect`, err);
          }
        }
      });
    });
  }
}
