import { Logger, LoggerConfig } from "./logger.provider";

/**
 * Logger Service Provider
 * Wrapper around Logger to be used as a dependency
 */
export class LoggerService extends Logger {
  constructor(context: string = "Application", config?: LoggerConfig) {
    super(context, config);
  }

  /**
   * Create a child logger with a new context
   */
  public child(context: string): LoggerService {
    return new LoggerService(context, (this as any).config);
  }
}
