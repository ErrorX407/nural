/**
 * Async Local Storage for Request Context
 * Used for Correlation IDs and other request-scoped data
 */
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestStore {
  correlationId?: string;
  [key: string]: unknown;
}

export const storage = new AsyncLocalStorage<RequestStore>();

/**
 * Run a callback with a fresh store
 */
export function runInContext<T>(store: RequestStore, callback: () => T): T {
  return storage.run(store, callback);
}

/**
 * Get the current store
 */
export function getContext(): RequestStore | undefined {
  return storage.getStore();
}

/**
 * Get a specific value from the current store
 */
export function getContextValue<K extends keyof RequestStore>(key: K): RequestStore[K] | undefined {
  const store = storage.getStore();
  return store ? store[key] : undefined;
}
