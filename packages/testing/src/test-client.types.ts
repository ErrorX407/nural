import type { FastifyInstance } from 'fastify';
import type { Server } from 'http';

export interface TestResponse {
  status: number;
  body: string | object | undefined;
  text: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface TestClient {
  get(url: string, headers?: Record<string, string>): Promise<TestResponse>;
  post(url: string, body?: string | object | undefined, headers?: Record<string, string>): Promise<TestResponse>;
  put(url: string, body?: string | object | undefined, headers?: Record<string, string>): Promise<TestResponse>;
  patch(url: string, body?: string | object | undefined, headers?: Record<string, string>): Promise<TestResponse>;
  delete(url: string, headers?: Record<string, string>): Promise<TestResponse>;
}

/**
 * Internal Server Adapter interface matching core implementation
 * Used for type-safe access throughout testing package
 */
export interface ServerAdapter {
  app: any | FastifyInstance;
  server: Server | any;
  listen(port: number, cb?: () => void): Server | any;
}

/**
 * Internal interface to access Nural private properties
 */
export interface NuralInternals {
  adapter: ServerAdapter;
  isExpress: boolean;
  [key: string]: any;
}