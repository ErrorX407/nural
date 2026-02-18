/**
 * HTTP Logger Middleware
 * Logs incoming requests with duration and status
 */

import { Logger } from "../core/logger";

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
}

/**
 * Creates an HTTP logger middleware
 */
export const httpLogger = (options: HttpLoggerOptions = {}) => {
  const logger = new Logger(options.context || "Router");

  return (req: any, res: any, next?: () => void) => {
    const start = Date.now();

    // Handle both Express (res) and Fastify (res.raw)
    const rawRes = res.raw || res;

    // Hook into the 'finish' event (Standard Node.js Stream Event)
    rawRes.on("finish", () => {
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

      if (options.showUserAgent) {
        logMessage += ` - ${userAgent}`;
      }

      // Color code based on status
      if (status >= 500) logger.error(logMessage);
      else if (status >= 400) logger.warn(logMessage);
      else logger.log(logMessage);
    });

    if (next) {
      next();
    }
  };
};
