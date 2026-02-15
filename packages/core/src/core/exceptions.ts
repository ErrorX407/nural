/**
 * Unified Exception System
 * NestJS-style HTTP exceptions for standardized error handling
 */

export interface HttpErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
  details?: unknown;
}

/**
 * Base HTTP Exception Class
 */
export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: unknown;

  constructor(
    response: string | Record<string, any>,
    statusCode: number,
    details?: unknown,
  ) {
    const message =
      typeof response === "string" ? response : JSON.stringify(response);
    super(message);
    this.statusCode = statusCode;
    this.error = this.getStatusName(statusCode);
    this.details = details;

    // Maintain prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public getResponse(): HttpErrorResponse {
    return {
      statusCode: this.statusCode,
      message: this.message,
      error: this.error,
      timestamp: new Date().toISOString(),
      details: this.details,
    };
  }

  private getStatusName(code: number): string {
    const names: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      406: "Not Acceptable",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      412: "Precondition Failed",
      413: "Payload Too Large",
      415: "Unsupported Media Type",
      418: "I'm a teapot",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };
    return names[code] || "Error";
  }
}

// --- Factory Classes for Common Exceptions ---

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not Found", details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, details);
  }
}

export class GoneException extends HttpException {
  constructor(message = "Gone", details?: unknown) {
    super(message, 410, details);
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message = "Payload Too Large", details?: unknown) {
    super(message, 413, details);
  }
}

export class UnsupportedMediaTypeException extends HttpException {
  constructor(message = "Unsupported Media Type", details?: unknown) {
    super(message, 415, details);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message = "Unprocessable Entity", details?: unknown) {
    super(message, 422, details);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message = "Internal Server Error", details?: unknown) {
    super(message, 500, details);
  }
}

export class NotImplementedException extends HttpException {
  constructor(message = "Not Implemented", details?: unknown) {
    super(message, 501, details);
  }
}

export class BadGatewayException extends HttpException {
  constructor(message = "Bad Gateway", details?: unknown) {
    super(message, 502, details);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message = "Service Unavailable", details?: unknown) {
    super(message, 503, details);
  }
}

export class GatewayTimeoutException extends HttpException {
  constructor(message = "Gateway Timeout", details?: unknown) {
    super(message, 504, details);
  }
}

/**
 * Custom Exception for specific use cases
 */
export class CustomException extends HttpException {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, statusCode, details);
  }
}
