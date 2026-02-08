/**
 * Application Configuration
 */

import type { NuralConfig } from "../../../../src";
import { errorHandler } from "./error-handler";

export const appConfig: NuralConfig = {
  framework: "express",

  // CORS configuration
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://myapp.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
  },

  // Security headers
  helmet: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: false, // Disable for API
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  },

  // Custom error handler
  errorHandler,

  // API documentation
  docs: {
    title: "Full-Featured API",
    version: "1.0.0",
    description:
      "Production-grade REST API with authentication, CRUD, and validation",
    path: "/docs",
    ui: "scalar",
  },

  // Logger configuration
  logger: {
    enabled: true,
    showUserAgent: true,
    showTime: true,
  },
};
