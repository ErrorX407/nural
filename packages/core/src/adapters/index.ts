/**
 * Adapters Module
 * Re-exports all server adapters
 */

export type { ServerAdapter, StaticRouteResponse } from "./server-adapter.interface";
export { ExpressAdapter } from "./express.adapter";
export { FastifyAdapter } from "./fastify.adapter";
export { SocketIoAdapter } from "./socket-io.adapter";
