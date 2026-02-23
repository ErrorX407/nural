/**
 * CORS Middleware
 * Zero-dependency CORS implementation for Nural
 */

import type { ResolvedCorsConfig } from "./middleware-config";

/**
 * CORS headers to apply to responses
 */
export interface CorsHeaders {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods"?: string;
  "Access-Control-Allow-Headers"?: string;
  "Access-Control-Allow-Credentials"?: string;
  "Access-Control-Expose-Headers"?: string;
  "Access-Control-Max-Age"?: string;
  Vary?: string;
}

/**
 * Check if origin is allowed based on config
 */
function isOriginAllowed(
  origin: string | undefined,
  config: ResolvedCorsConfig,
): string | false {
  if (!origin) return false;

  const { origin: allowedOrigin } = config;

  // Allow all origins
  if (allowedOrigin === true || allowedOrigin === "*") {
    return config.credentials ? origin : "*";
  }

  // Single origin string
  if (typeof allowedOrigin === "string") {
    return origin === allowedOrigin ? origin : false;
  }

  // Array of origins
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin) ? origin : false;
  }

  // Function check
  if (typeof allowedOrigin === "function") {
    return allowedOrigin(origin) ? origin : false;
  }

  return false;
}

/**
 * Generate CORS headers for a request
 */
export function getCorsHeaders(
  requestOrigin: string | undefined,
  config: ResolvedCorsConfig,
  isPreflight: boolean = false,
): CorsHeaders | null {
  const allowedOrigin = isOriginAllowed(requestOrigin, config);

  if (!allowedOrigin) {
    return null;
  }

  const headers: CorsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
  };

  // Add Vary header when origin is dynamic
  if (allowedOrigin !== "*") {
    headers["Vary"] = "Origin";
  }

  // Credentials
  if (config.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  // Exposed headers
  if (config.exposedHeaders.length > 0) {
    headers["Access-Control-Expose-Headers"] = config.exposedHeaders.join(", ");
  }

  // Preflight-specific headers
  if (isPreflight) {
    headers["Access-Control-Allow-Methods"] = config.methods.join(", ");
    headers["Access-Control-Allow-Headers"] = config.allowedHeaders.join(", ");
    headers["Access-Control-Max-Age"] = String(config.maxAge);
  }

  return headers;
}

/**
 * Handle CORS for Express
 */
export function applyCorsExpress(app: any, config: ResolvedCorsConfig): void {
  // Add CORS headers to all responses (including preflight)
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    const isPreflight = req.method === "OPTIONS";
    const headers = getCorsHeaders(origin, config, isPreflight);

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (value) res.setHeader(key, value);
      });
    }

    // Handle preflight response
    if (isPreflight) {
      if (config.preflightContinue) {
        next();
      } else {
        res.status(config.optionsSuccessStatus).end();
      }
      return;
    }

    next();
  });
}

/**
 * Handle CORS for Fastify
 */
export function applyCorsFastify(app: any, config: ResolvedCorsConfig): void {
  // Add hook for all requests
  app.addHook("onRequest", async (request: any, reply: any) => {
    const origin = request.headers.origin;
    const isPreflight = request.method === "OPTIONS";
    const headers = getCorsHeaders(origin, config, isPreflight);

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (value) reply.header(key, value);
      });
    }

    // Handle preflight
    if (isPreflight && !config.preflightContinue) {
      reply.status(config.optionsSuccessStatus).send();
      return;
    }
  });
}
