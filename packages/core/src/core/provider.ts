import { Logger } from "./logger";

const logger = new Logger("Provider");

/**
 * A better way to define infrastructure services (DB, Redis, etc).
 * Supports automatic lifecycle management (init/destroy).
 */
export interface ProviderConfig<T> {
  name: string;
  /**
   * Called when the application starts.
   * Return the client/connection instance here.
   */
  setup: () => Promise<T> | T;
  /**
   * Called when the application stops (graceful shutdown).
   */
  teardown?: (instance: T) => Promise<void> | void;
}

export interface NuralProvider<T> {
  name: string;
  getInstance: () => T; // Access the initialized client
  init: () => Promise<void>;
  destroy: () => Promise<void>;
}

export function defineProvider<T>(config: ProviderConfig<T>): NuralProvider<T> {
  let instance: T | null = null;
  return {
    name: config.name,
    getInstance: () => {
      if (!instance) throw new Error(`Provider '${config.name}' not initialized.`);
      return instance;
    },
    init: async () => {
      logger.log(`🔌 [${config.name}] Connecting...`);
      instance = await config.setup();
    },
    destroy: async () => {
      if (instance && config.teardown) {
        logger.log(`🔌 [${config.name}] Disconnecting...`);
        await config.teardown(instance);
        instance = null;
      }
    },
  };
}