/**
 * Configuration Types
 * Types for Nural framework configuration
 */

/**
 * Documentation configuration options
 */
export interface DocsConfig {
  /** Enable documentation endpoint */
  enabled?: boolean;
  /** API title shown in docs */
  title?: string;
  /** API version */
  version?: string;
  /** API description */
  description?: string;
  /** Documentation UI path (default: /docs) */
  path?: string;
  /** Documentation UI type */
  ui?: "scalar" | "swagger";
}

/**
 * Main Nural framework configuration
 */
export interface NuralConfig {
  /** Server framework to use */
  framework?: "express" | "fastify";
  /** Documentation settings (true for defaults, false to disable, or DocsConfig) */
  docs?: boolean | DocsConfig;
  /** CORS settings (true for defaults, false to disable, or CorsConfig) */
  cors?: boolean | import("./middleware").CorsConfig;
  /** Helmet security headers (true for defaults, false to disable, or HelmetConfig) */
  helmet?: boolean | import("./middleware").HelmetConfig;
  /** Logger configuration */
  logger?: {
    enabled?: boolean;
    showUserAgent?: boolean;
    showTime?: boolean;
  };
  /** Global error handler (true for defaults, function, or config) */
  errorHandler?:
    | boolean
    | import("./error").ErrorHandler
    | import("./error").ErrorHandlerConfig;
}

/**
 * Resolved documentation configuration (with defaults applied)
 */
export interface ResolvedDocsConfig {
  enabled: boolean;
  title: string;
  version: string;
  description: string;
  path: string;
  ui: "scalar" | "swagger";
}

/**
 * Default documentation configuration
 */
export const DEFAULT_DOCS_CONFIG: ResolvedDocsConfig = {
  enabled: true,
  title: "Nural API",
  version: "1.0.0",
  description: "Powered by Nural Framework",
  path: "/docs",
  ui: "scalar",
};

/**
 * Resolve docs config from user input
 */
export function resolveDocsConfig(
  docs?: boolean | DocsConfig,
): ResolvedDocsConfig {
  if (docs === false) {
    return { ...DEFAULT_DOCS_CONFIG, enabled: false };
  }

  if (docs === true || docs === undefined) {
    return DEFAULT_DOCS_CONFIG;
  }

  return {
    enabled: docs.enabled ?? true,
    title: docs.title ?? DEFAULT_DOCS_CONFIG.title,
    version: docs.version ?? DEFAULT_DOCS_CONFIG.version,
    description: docs.description ?? DEFAULT_DOCS_CONFIG.description,
    path: docs.path ?? DEFAULT_DOCS_CONFIG.path,
    ui: docs.ui ?? DEFAULT_DOCS_CONFIG.ui,
  };
}
