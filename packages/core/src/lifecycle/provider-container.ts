import { Logger } from "../common/logger.provider";

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

export class ProviderContainer {
  private providers = new Map<string, NuralProvider<any>>();

  constructor(private readonly logger: Logger) {}

  public async register<T>(provider: NuralProvider<T>): Promise<T> {
    if (this.providers.has(provider.name)) {
      this.logger.warn(`Provider '${provider.name}' is already registered.`);
      return provider.getInstance();
    }

    this.logger.info(`Registering provider: ${provider.name}`);
    await provider.init();
    this.providers.set(provider.name, provider);
    return provider.getInstance();
  }

  public async destroyAll() {
    this.logger.info("Disconnecting all providers...");
    // Destroy in reverse order of registration (LIFO) usually safer for dependencies
    const providers = Array.from(this.providers.values()).reverse();
    
    for (const provider of providers) {
        try {
            this.logger.info(`Disconnecting provider: ${provider.name}`);
            await provider.destroy();
        } catch (error) {
            this.logger.error(`Error disconnecting provider ${provider.name}:`, error);
        }
    }
    this.providers.clear();
  }

  public get<T>(name: string): T | undefined {
    return this.providers.get(name)?.getInstance();
  }
}
