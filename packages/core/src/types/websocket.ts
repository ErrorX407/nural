import type { InferZ, ZodAny } from "./route";

/**
 * Configuration for a single Gateway Event
 */
export interface GatewayEventConfig<
  Schema extends ZodAny = any,
  Services extends Record<string, unknown> = any
> {
  /**
   * The event name to listen for (e.g., 'message', 'join')
   */
  event: string;

  /**
   * Optional Zod Schema to validate incoming data
   */
  schema?: Schema;

  /**
   * The handler function
   */
  handler: (ctx: {
    client: any; // Socket instance
    data: InferZ<Schema>;
  } & Services) => void | Promise<void> | any;
}

/**
 * Configuration for a WebSocket Gateway
 */
/**
 * Configuration for a WebSocket Gateway
 */
export interface GatewayConfig<
  Services extends Record<string, unknown> = any,
  Events extends readonly GatewayEventConfig<any, Services>[] = GatewayEventConfig<any, Services>[]
> {
  /**
   * Namespace for this gateway (e.g., '/chat')
   * @default '/'
   */
  namespace?: string;

  /**
   * Dependencies to inject into handlers
   */
  inject?: Services;

  /**
   * Lifecycle hook: Called when a client connects
   */
  onConnect?: (client: any, deps: Services) => void;

  /**
   * Lifecycle hook: Called when a client disconnects
   */
  onDisconnect?: (client: any, deps: Services) => void;

  /**
   * List of event handlers
   */
  events: Events;
}

/**
 * Helper to create a type-safe gateway configuration
 */
export function createGateway<
  Services extends Record<string, unknown>,
  const Events extends readonly { event: string; schema?: ZodAny }[]
>(
  config: Omit<GatewayConfig<Services, any>, "events"> & {
    events: {
      [K in keyof Events]: GatewayEventConfig<Events[K]["schema"], Services> & {
          event: Events[K]["event"];
          schema?: Events[K]["schema"];
      }
    }
  }
): GatewayConfig<Services, any> {
  return config as any;
}
