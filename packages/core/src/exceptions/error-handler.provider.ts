/**
 * Error Types and Handler
 * Types for global error handling
 */

import type { Request, Response } from "express";
import type { FastifyRequest, FastifyReply } from "fastify";
import { HttpException } from "../exceptions/http-exception.class";

/**
 * Error context passed to error handlers
 */
export interface ErrorContext {
  /** The error that occurred */
  error: Error;
  /** HTTP request (Express or Fastify) */
  request: Request | FastifyRequest;
  /** HTTP response (Express or Fastify) */
  response: Response | FastifyReply;
  /** Route path that errored */
  path?: string;
  /** HTTP method */
  method?: string;
}

/**
 * Error response returned by error handlers
 */
export interface ErrorResponse {
  /** HTTP status code */
  status: number;
  /** Response body */
  body: Record<string, unknown>;
  /** Optional headers to set */
  headers?: Record<string, string>;
}

/**
 * Global error handler function type
 */
export type ErrorHandler = (
  ctx: ErrorContext,
) => ErrorResponse | Promise<ErrorResponse>;

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Custom error handler function */
  handler?: ErrorHandler;
  /** Include stack trace in development */
  includeStack?: boolean;
  /** Log errors to console */
  logErrors?: boolean;
  /** Custom error logger */
  logger?: (error: Error, ctx: ErrorContext) => void;
}

/**
 * Resolved error handler config with defaults
 */
export interface ResolvedErrorHandlerConfig {
  handler: ErrorHandler;
  includeStack: boolean;
  logErrors: boolean;
  logger: (error: Error, ctx: ErrorContext) => void;
}

/**
 * Default error logger
 */
const defaultLogger = (error: Error, ctx: ErrorContext) => {
  console.error(`[Nural Error] ${ctx.method} ${ctx.path}:`, error.message);
  if (error.stack) {
    console.error(error.stack);
  }
};

/**
 * Default error handler - converts errors to HTTP responses
 */
export const defaultErrorHandler: ErrorHandler = (ctx) => {
  const { error } = ctx;

  // Zod validation error
  if (error.name === "ZodError" && "issues" in error) {
    return {
      status: 400,
      body: {
        error: "Validation Error",
        message: "Request validation failed",
        details: (error as Record<string, unknown>)['issues'],
      },
    };
  }

  // Unified Exception Handling
  if (error instanceof HttpException) {
    const response = error.getResponse();
    return {
      status: response.statusCode,
      body: response as unknown as Record<string, unknown>,
    };
  }

  // Custom HTTP error (has status property) - Legacy support
  if ("status" in error && typeof (error as Record<string, unknown>)['status'] === "number") {
    return {
      status: (error as Record<string, unknown>)['status'] as number,
      body: {
        error: error.name || "Error",
        message: error.message,
      },
    };
  }

  // Auth errors
  if (
    error.message.toLowerCase().includes("unauthorized") ||
    error.message.toLowerCase().includes("authentication")
  ) {
    return {
      status: 401,
      body: {
        error: "Unauthorized",
        message: error.message,
      },
    };
  }

  if (
    error.message.toLowerCase().includes("forbidden") ||
    error.message.toLowerCase().includes("permission")
  ) {
    return {
      status: 403,
      body: {
        error: "Forbidden",
        message: error.message,
      },
    };
  }

  if (error.message.toLowerCase().includes("not found")) {
    return {
      status: 404,
      body: {
        error: "Not Found",
        message: error.message,
      },
    };
  }

  // Default: Internal Server Error
  return {
    status: 500,
    body: {
      error: "Internal Server Error",
      message:
        process.env['NODE_ENV'] === "production"
          ? "An unexpected error occurred"
          : error.message,
    },
  };
};

/**
 * Default error handler config
 */
export const DEFAULT_ERROR_HANDLER_CONFIG: ResolvedErrorHandlerConfig = {
  handler: defaultErrorHandler,
  includeStack: process.env['NODE_ENV'] !== "production",
  logErrors: true,
  logger: defaultLogger,
};

/**
 * Resolve error handler config from user input
 */
export function resolveErrorHandlerConfig(
  config?: boolean | ErrorHandler | ErrorHandlerConfig,
): ResolvedErrorHandlerConfig {
  // Disabled
  if (config === false) {
    return {
      ...DEFAULT_ERROR_HANDLER_CONFIG,
      logErrors: false,
    };
  }

  // Default config
  if (config === true || config === undefined) {
    return DEFAULT_ERROR_HANDLER_CONFIG;
  }

  // Function only
  if (typeof config === "function") {
    return {
      ...DEFAULT_ERROR_HANDLER_CONFIG,
      handler: config,
    };
  }

  // Full config object
  return {
    handler: config.handler ?? DEFAULT_ERROR_HANDLER_CONFIG.handler,
    includeStack:
      config.includeStack ?? DEFAULT_ERROR_HANDLER_CONFIG.includeStack,
    logErrors: config.logErrors ?? DEFAULT_ERROR_HANDLER_CONFIG.logErrors,
    logger: config.logger ?? DEFAULT_ERROR_HANDLER_CONFIG.logger,
  };
}
