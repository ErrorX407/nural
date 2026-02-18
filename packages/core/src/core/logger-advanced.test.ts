import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "./logger";
import { runInContext } from "./storage";
import * as fs from "fs";
import * as path from "path";

const LOG_DIR = path.join(__dirname, "test-logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

describe("Logger (Advanced)", () => {
  beforeEach(() => {
    // Clean up
    if (fs.existsSync(LOG_DIR)) {
      fs.rmSync(LOG_DIR, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (Logger.fileTransport) {
        Logger.fileTransport.close();
        Logger.fileTransport = undefined;
    }
    if (fs.existsSync(LOG_DIR)) {
      fs.rmSync(LOG_DIR, { recursive: true, force: true });
    }
  });

  it("should propagate correlation ID via storage", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const logger = new Logger("ContextTest", { json: true });
    
    await runInContext({ correlationId: "test-correlation-id" }, async () => {
      logger.info("Test context");
      
      expect(spy).toHaveBeenCalled();
      const output = spy.mock.calls[0]?.[0] as string;
      expect(output).toBeDefined();
      const logObj = JSON.parse(output);
      expect(logObj.correlationId).toBe("test-correlation-id");
    });
  });

  it("should write logs to file", async () => {
    const logger = new Logger("FileTest", {
      file: { 
        enabled: true, 
        path: LOG_FILE,
        json: true 
      }
    });

    logger.info("Hello File");
    
    // Give stream a moment to flush
    await new Promise((r) => setTimeout(r, 500));
    
    // Force close to ensure flush
    if (Logger.fileTransport) {
        Logger.fileTransport.close();
        Logger.fileTransport = undefined;
    }

    expect(fs.existsSync(LOG_FILE)).toBe(true);
    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const logObj = JSON.parse(content.trim());
    
    expect(logObj.message).toBe("Hello File");
    expect(logObj.context).toBe("FileTest");
  });

  it("should log to console in pretty format", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const logger = new Logger("PrettyTest", {
      json: false,
      console: { enabled: true, json: false }
    });

    logger.info("Pretty Log");
    
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0]?.[0] as string;
    expect(output).toBeDefined();
    
    // Strip ANSI codes for easier assertion
    const cleanOutput = output.replace(/\u001b\[\d+m/g, "");
    expect(cleanOutput).toContain("[PrettyTest]");
    expect(cleanOutput).toContain("Pretty Log");
    expect(output).not.toContain('{"'); // Should not start as JSON object
  });
});
