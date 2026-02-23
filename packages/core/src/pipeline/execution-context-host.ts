
import { ExecutionContext, ContextType, HttpArgumentsHost, WsArgumentsHost } from './execution-context.interface';

export class ExecutionContextHost implements ExecutionContext {
  [key: string]: unknown;
  private contextType: ContextType = 'http';
  private constructorRef: unknown = null;
  private handlerRef: ((...args: unknown[]) => unknown) | null = null;
  private _handlerName: string = 'anonymous';
  private metadata: Record<string, unknown> = {};

  get handlerName(): string {
    return this.handlerRef?.name || this._handlerName;
  }

  constructor(
    private readonly args: unknown[], // [req, res, next] or [client, data]
    constructorRef: unknown = null,
    handlerRef: ((...args: unknown[]) => unknown) | null = null,
    type?: ContextType,
    metadata: Record<string, unknown> = {}
  ) {
    this.constructorRef = constructorRef;
    this.handlerRef = handlerRef;
    this.metadata = metadata;
    if (type) {
      this.contextType = type;
    }
  }

  setType(type: ContextType): void {
    this.contextType = type;
  }

  getType(): ContextType {
    return this.contextType;
  }

  getClass<T = unknown>(): T {
    return this.constructorRef as T;
  }

  getHandler(): ((...args: unknown[]) => unknown) | null {
    return this.handlerRef;
  }

  getHandlerName(): string {
    return this.handlerRef?.name || this._handlerName;
  }

  setHandlerName(name: string): void {
    this._handlerName = name;
  }

  switchToHttp(): HttpArgumentsHost {
    return {
      getRequest: <T = unknown>() => this.args[0] as T,
      getResponse: <T = unknown>() => this.args[1] as T,
      getNext: <T = unknown>() => this.args[2] as T,
    };
  }

  switchToWs(): WsArgumentsHost {
    return {
      getClient: <T = unknown>() => this.args[0] as T,
      getData: <T = unknown>() => this.args[1] as T,
    };
  }

  getRequest<T = unknown>(): T {
    return this.args[0] as T;
  }

  getResponse<T = unknown>(): T {
    return this.args[1] as T;
  }

  getMetadata<T = Record<string, unknown>>(): T {
    // Metadata can be passed in constructor or set later
    return this.metadata as T;
  }
}
