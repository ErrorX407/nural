import { describe, it, expect, vi } from "vitest";
import { LoggerService } from "./logger.service";
import { ConfigService, defineConfig } from "./config";
import { z } from "zod";

describe("LoggerService", () => {
  it("should output JSON when configured", () => {
    const consoleSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    
    const logger = new LoggerService("Test", { json: true });
    logger.info("Test Message");

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    const logObj = JSON.parse(output);

    expect(logObj).toHaveProperty("timestamp");
    expect(logObj).toHaveProperty("level", "INFO");
    expect(logObj).toHaveProperty("context", "Test");
    expect(logObj).toHaveProperty("message", "Test Message");

    consoleSpy.mockRestore();
  });

  it("should output pretty string when JSON is false", () => {
    const consoleSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    
    const logger = new LoggerService("Test", { json: false });
    logger.info("Test Message");

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    // Strip ANSI codes
    const cleanOutput = output.replace(/\u001b\[\d+m/g, "");
    
    expect(cleanOutput).toContain("[INFO]");
    expect(cleanOutput).toContain("[Test]");
    expect(cleanOutput).toContain("Test Message");

    consoleSpy.mockRestore();
  });

  it("should respect log levels", () => {
    const consoleSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    
    const logger = new LoggerService("Test", { minLevel: "warn", json: true });
    logger.info("Should not log");
    logger.warn("Should log");

    if (consoleSpy.mock.calls.length > 1) {
      console.log("DEBUG: Unexpected calls:", consoleSpy.mock.calls);
    }

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(JSON.parse(output).message).toBe("Should log");

    consoleSpy.mockRestore();
  });
});

describe("ConfigService", () => {
  it("should validate and transform environment variables", () => {
    process.env.TEST_PORT = "8080";
    
    const config = defineConfig(z.object({
      TEST_PORT: z.string().transform(Number)
    }), { skipValidation: false });

    expect(config.get("TEST_PORT")).toBe(8080);
  });
});
