/**
 * HTTP Logger Middleware
 * Logs incoming requests with duration and status
 */

import { Logger, LoggerConfig } from "../core/logger";
import * as crypto from "crypto";
import { runInContext } from "../core/storage";

// Method Colors
const methodColors: Record<string, string> = {
  GET: "\x1b[32m", // Green
  POST: "\x1b[33m", // Yellow
  PUT: "\x1b[34m", // Blue
  DELETE: "\x1b[31m", // Red
  PATCH: "\x1b[35m", // Magenta
  OPTIONS: "\x1b[90m", // Gray
  HEAD: "\x1b[90m", // Gray
};

const resetColor = "\x1b[0m";

export interface HttpLoggerOptions {
  /** Show user agent in logs */
  showUserAgent?: boolean;
  /** Show request duration in logs */
  showTime?: boolean;
  /** Custom logger context name */
  context?: string;
  /** Logger configuration (JSON, custom levels, etc.) */
  config?: LoggerConfig;
}

/**
 * Creates an HTTP logger middleware
 */

export const httpLogger = (options: HttpLoggerOptions = {}) => {
  const logger = new Logger(options.context || "Router", options.config);

  return (req: any, res: any, next?: () => void) => {
    const correlationId = crypto.randomUUID();
    
    // Run the request in a storage context
    runInContext({ correlationId }, () => {
        const start = Date.now();
        const rawRes = res.raw || res;

        // Set Correlation ID header if not present
        if (req.headers && !req.headers["x-correlation-id"]) {
            // In a real generic middleware, we might not be able to set req headers easily if they are read-only
            // But we can try to set response header
             if (res.setHeader) {
                res.setHeader("X-Correlation-ID", correlationId);
            }
        }

        rawRes.on("finish", () => {
          // Re-enter the context to ensure logger has access to correlationId
          runInContext({ correlationId }, () => {
              const { method, url, headers } = req;
              const duration = Date.now() - start;
              const status = rawRes.statusCode;
              const userAgent = headers ? headers["user-agent"] || "-" : "-";

              const methodColor = methodColors[method] || resetColor;
              const coloredMethod = `${methodColor}${method}${resetColor}`;

              let logMessage = `${coloredMethod} ${url} ${status}`;

              if (options.showTime !== false) {
                logMessage += ` +${duration}ms`;
              }

              // Check config for User Agent
              const meta: any = {};
              if (options.showUserAgent || options.config?.http?.userAgent) {
                meta.userAgent = userAgent;
                // logMessage += ` - ${userAgent}`; // Handled by logger formatters now
              }

              // Color code based on status
              if (status >= 500) logger.error(logMessage, meta);
              else if (status >= 400) logger.warn(logMessage, meta);
              else logger.log(logMessage, meta);
          });
        });

        if (next) {
          next();
        }
    });
  };
};
