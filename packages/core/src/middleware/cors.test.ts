/**
 * CORS Middleware Tests
 */

import { describe, it, expect } from "vitest";
import { getCorsHeaders } from "./cors";
import type { ResolvedCorsConfig } from "../types/middleware";
import { DEFAULT_CORS_CONFIG } from "../types/middleware";

describe("CORS Middleware", () => {
  describe("getCorsHeaders", () => {
    it("should return null when origin is not allowed", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        origin: "https://example.com",
      };

      const headers = getCorsHeaders("https://other.com", config);
      expect(headers).toBeNull();
    });

    it("should allow all origins when origin is '*'", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        origin: "*",
      };

      const headers = getCorsHeaders("https://any.com", config);
      expect(headers).not.toBeNull();
      expect(headers!["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("should return specific origin when credentials are enabled", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        origin: "*",
        credentials: true,
      };

      const headers = getCorsHeaders("https://specific.com", config);
      expect(headers!["Access-Control-Allow-Origin"]).toBe(
        "https://specific.com",
      );
      expect(headers!["Access-Control-Allow-Credentials"]).toBe("true");
    });

    it("should match allowed origins array", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        origin: ["https://a.com", "https://b.com"],
      };

      expect(getCorsHeaders("https://a.com", config)).not.toBeNull();
      expect(getCorsHeaders("https://b.com", config)).not.toBeNull();
      expect(getCorsHeaders("https://c.com", config)).toBeNull();
    });

    it("should support function origin check", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        origin: (origin) => origin.endsWith(".example.com"),
      };

      expect(getCorsHeaders("https://app.example.com", config)).not.toBeNull();
      expect(getCorsHeaders("https://other.com", config)).toBeNull();
    });

    it("should include preflight headers when isPreflight is true", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        maxAge: 3600,
      };

      const headers = getCorsHeaders("https://example.com", config, true);
      expect(headers!["Access-Control-Allow-Methods"]).toBe("GET, POST");
      expect(headers!["Access-Control-Allow-Headers"]).toBe("Content-Type");
      expect(headers!["Access-Control-Max-Age"]).toBe("3600");
    });

    it("should include exposed headers when configured", () => {
      const config: ResolvedCorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        exposedHeaders: ["X-Custom-Header", "X-Request-Id"],
      };

      const headers = getCorsHeaders("https://example.com", config);
      expect(headers!["Access-Control-Expose-Headers"]).toBe(
        "X-Custom-Header, X-Request-Id",
      );
    });
  });
});
