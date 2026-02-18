/**
 * Config Service
 * Type-safe environment configuration with Zod validation
 */

import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

export interface ConfigOptions {
  /** Path to .env file (default: .env in cwd) */
  path?: string;
  /** Skip validation on startup */
  skipValidation?: boolean;
}

/**
 * Config Service Class
 */
export class ConfigService<Schema extends z.ZodObject<any>> {
  private config: z.infer<Schema>;
  private schema: Schema;

  constructor(schema: Schema, options: ConfigOptions = {}) {
    this.schema = schema;
    
    // Load .env if not already loaded or specific path requested
    const envPath = options.path || path.resolve(process.cwd(), ".env");
    dotenv.config({ path: envPath });

    if (options.skipValidation) {
      this.config = process.env as unknown as z.infer<Schema>;
      return;
    }

    const result = schema.safeParse(process.env);

    if (!result.success) {
      console.error("\x1b[31m%s\x1b[0m", "\n❌ Invalid Environment Configuration:");
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        console.error(`  - \x1b[33m${path}\x1b[0m: ${issue.message}`);
      });
      console.error(""); // Newline
      process.exit(1);
    }

    this.config = result.data;
  }

  /**
   * Get a typed configuration value
   */
  public get<K extends keyof z.infer<Schema>>(key: K): z.infer<Schema>[K] {
    return this.config[key];
  }

  /**
   * Get the entire configuration object
   */
  public getAll(): z.infer<Schema> {
    return this.config;
  }
}

/**
 * Define a type-safe configuration
 * 
 * @example
 * ```typescript
 * const config = defineConfig(z.object({
 *   PORT: z.string().transform(Number),
 *   DB_URL: z.string()
 * }));
 * ```
 */
export function defineConfig<Schema extends z.ZodObject<any>>(
  schema: Schema,
  options?: ConfigOptions
) {
  return new ConfigService(schema, options);
}
