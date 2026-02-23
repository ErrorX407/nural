import { z } from "zod";
import { Socket } from "socket.io";
import { InferZ, ZodAny } from "../router/route-storage.types";

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GatewayEventConfig<
  Schema extends ZodAny = any,
  Services extends Record<string, unknown> = any,
  Client = Socket
> {
  event: string;
  payload?: Schema;
  handler: (ctx: {
    client: Client;
    message: InferZ<Schema>;
  } & Services) => void | Promise<void> | any;
}

export interface GatewayConfig<
  Services extends Record<string, unknown> = any,
  Client = Socket
> {
  namespace?: string;
  inject?: Services;
  middleware?: Array<(socket: Client, deps: Services) => Promise<void> | void>;
  onConnect?: (client: Client, deps: Services) => void;
  onDisconnect?: (client: Client, deps: Services) => void;
  events: GatewayEventConfig<any, Services, Client>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GatewayBuilder — returned by createGateway()
//
// Each .event() call is its own isolated generic resolution:
//   S is inferred from payload → handler's message is typed as z.infer<S>
//   Services is captured once from inject → available in every handler
//
// This is identical to how createRoute() infers B from request.body.
// The fluent chain is just sugar — internally it pushes to an events array.
// ─────────────────────────────────────────────────────────────────────────────

export class GatewayBuilder<Services extends Record<string, unknown>, Client = Socket> {
  private config: GatewayConfig<Services, Client>;

  constructor(config: Omit<GatewayConfig<Services, Client>, "events">) {
    this.config = { ...config, events: [] };
  }

  /**
   * Register a typed event on this gateway.
   * `message` is automatically inferred from `payload`.
   * All injected services are available alongside `client` and `message`.
   *
   * @example
   * ```typescript
   * .event({
   *   event: "message",
   *   payload: MessageSchema,
   *   handler: ({ client, message, authService }) => {
   *     message.text        // ✅ string
   *     authService.verify  // ✅ typed
   *   },
   * })
   * ```
   */
  event<S extends z.ZodTypeAny = z.ZodNever>(config: {
    event: string;
    payload?: S;
    handler: (ctx: {
      client: Client;
      /** Auto-typed from `payload`. `unknown` when payload is omitted. */
      message: [S] extends [z.ZodNever] ? unknown : z.infer<S>;
    } & Services) => void | Promise<void> | any;
  }): this {
    this.config.events.push(config as any);
    return this;
  }

  /** @internal — used by the adapter to get the resolved config */
  getConfig(): GatewayConfig<Services, Client> {
    return this.config;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createGateway
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a type-safe WebSocket gateway.
 *
 * Chain `.event()` calls to register events. Each event infers `message`
 * automatically from `payload` and has access to all injected services.
 *
 * @example
 * ```typescript
 * export const chatGateway = createGateway({
 *   namespace: "/chat",
 *   inject: { authService, db },
 *   onConnect: (client, { authService }) => { ... },
 * })
 *   .event({
 *     event: "message",
 *     payload: Schema.object({ text: Schema.string() }),
 *     handler: ({ client, message, authService }) => {
 *       message.text        // ✅ string — inferred from payload
 *       authService.verify  // ✅ fully typed — from inject
 *     },
 *   })
 *   .event({
 *     event: "join",
 *     payload: Schema.object({ room: Schema.string() }),
 *     handler: ({ client, message }) => {
 *       client.join(message.room) // ✅ string
 *     },
 *   });
 * ```
 */
export function createGateway<Services extends Record<string, unknown>, Client = Socket>(config: {
  namespace?: string;
  inject?: Services;
  middleware?: Array<(socket: Client, deps: Services) => Promise<void> | void>;
  onConnect?: (client: Client, deps: Services) => void;
  onDisconnect?: (client: Client, deps: Services) => void;
}): GatewayBuilder<Services, Client> {
  return new GatewayBuilder<Services, Client>(config);
}