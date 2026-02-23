
import { Logger } from "../common/logger.provider";

export class ExceptionsZone {
  private static readonly logger = new Logger("ExceptionsZone");

  public static async run(callback: () => Promise<void>, teardown?: () => void) {
    try {
      await callback();
    } catch (e) {
      this.logger.error("Caught unhandled exception:", e);
      if (teardown) {
        teardown();
      }
      // Rethrow? Or handle globally? For now we just log.
      // In a real zone, we might kill the process or request context.
      throw e;
    }
  }
}
