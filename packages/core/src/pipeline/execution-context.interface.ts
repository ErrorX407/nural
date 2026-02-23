
export type ContextType = 'http' | 'ws' | 'cron';

export interface HttpArgumentsHost {
  getRequest<T = unknown>(): T;
  getResponse<T = unknown>(): T;
  getNext<T = unknown>(): T;
}

export interface WsArgumentsHost {
  getData<T = unknown>(): T;
  getClient<T = unknown>(): T;
}

export interface ExecutionContext<TRequest = unknown, TResponse = unknown> {
  /**
   * Allow dynamic property access for middleware-injected data (e.g. ctx.user)
   */
  [key: string]: unknown;

  /**
   * The name of the handler function (convenience property).
   */
  readonly handlerName: string;

  /**
   * Returns the type of the context.
   */
  getType(): ContextType;

  /**
   * Returns the handler class reference.
   */
  getClass<T = unknown>(): T;

  /**
   * Returns the handler method reference.
   */
  getHandler(): ((...args: unknown[]) => unknown) | null;

  /**
   * Returns the name of the handler function.
   */
  getHandlerName(): string;

  /**
   * Switch context to HTTP.
   */
  switchToHttp(): HttpArgumentsHost;

  /**
   * Switch context to WebSockets.
   */
  switchToWs(): WsArgumentsHost;

  /**
   * Get route metadata
   */
  getMetadata<T = Record<string, unknown>>(): T;

  // Legacy/Direct access (deprecated preferred, but useful for generic guards)
  getRequest(): TRequest;
  getResponse(): TResponse;
}

/**
 * Infers the Context type for a given Route Config
 */
export type InferContext<T> = T extends { inject: infer I }
  ? ExecutionContext & I
  : ExecutionContext;
