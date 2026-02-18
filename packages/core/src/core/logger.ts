import * as fs from "fs";
import * as path from "path";
import { getContextValue } from "./storage";

/**
 * Zero-Dependency Logger
 * Lightweight, colorful, and powerful logging system
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
};

export interface TransportConfig {
  enabled?: boolean;
  minLevel?: LogLevel;
  json?: boolean;
  /** Show correlation ID (default: true) */
  correlationId?: boolean;
}

export interface FileTransportConfig extends TransportConfig {
  path: string;
}

export interface LoggerConfig {
  /** Enable/disable logging */
  enabled?: boolean;
  /** Global minimum log level (default: info) */
  minLevel?: LogLevel;
  /** Show timestamp (default: true) */
  timestamp?: boolean;
  /** Output logs as JSON (default: false) - Backward compatibility */
  /** Output logs as JSON (default: false) - Backward compatibility */
  json?: boolean;
  
  /** Show correlation ID globally (default: true) */
  correlationId?: boolean;
  
  /** Console Transport Configuration */
  console?: TransportConfig;
  /** File Transport Configuration */
  file?: FileTransportConfig;
  
  /** HTTP Request Logging Configuration */
  http?: {
    /** Log User Agent (default: false) */
    userAgent?: boolean;
  }
}

interface LogEntry {
  timestamp: string;
  level: string;
  pid: number;
  context: string;
  message: string;
  correlationId?: string;
  data?: any[];
}

/**
 * Base Transport Class
 */
abstract class Transport {
  constructor(protected config: TransportConfig) {}

  shouldLog(level: LogLevel): boolean {
    if (this.config.enabled === false) return false;
    const minLevel = this.config.minLevel || "info";
    return levels[level] >= levels[minLevel];
  }

  abstract log(entry: LogEntry): void;

  protected formatJson(entry: LogEntry): string {
    // Strip ANSI codes from message for JSON
    const cleanMessage = entry.message.replace(/\u001b\[\d+m/g, "");
    
    // Filter correlationId if disabled
    let finalEntry: any = { ...entry, message: cleanMessage };
    
    // Merge data if it exists and is an object (for structured logging)
    if (finalEntry.data && Array.isArray(finalEntry.data)) {
        for (const item of finalEntry.data) {
            if (typeof item === 'object' && item !== null) {
                Object.assign(finalEntry, item);
            }
        }
        // Optional: keep data or remove it? verify-logger.ts might rely on it.
        // Let's keep it but also merge.
        // Or remove if merged? "Clean" JSON usually implies flattened.
        // Let's remove 'data' from finalEntry if we merged it to avoid duplication noise.
        delete finalEntry.data;
    }

    if (this.config.correlationId === false) {
        const { correlationId, ...rest } = finalEntry;
        finalEntry = rest;
    }
    
    return JSON.stringify(finalEntry) + "\n";
  }

  protected formatPretty(entry: LogEntry): string {
    const { timestamp, level, context, message, correlationId, data } = entry;
    
    const color =
      level === "ERROR"
        ? colors.red
        : level === "WARN"
        ? colors.yellow
        : level === "INFO"
        ? colors.green
        : colors.blue;

    const ctx = `[${colors.yellow}${context}${colors.reset}]`;
    const levelTag = `${color}[${level}]${colors.reset}`;
    
    const showCorrelation = this.config.correlationId !== false;
    const correlationTag = (correlationId && showCorrelation) ? `${colors.cyan}[${correlationId}]${colors.reset} ` : "";
    
    const pidTag = `${colors.gray}${entry.pid}${colors.reset}`;

    let suffix = "";
    const remainingData: any[] = [];
    
    if (data && Array.isArray(data)) {
        for (const item of data) {
            if (typeof item === 'object' && item !== null && item.userAgent) {
                 suffix += ` - ${colors.gray}${item.userAgent}${colors.reset}`;
            } else {
                 remainingData.push(item);
            }
        }
    }

    let line = `[Nural] ${pidTag}  - ${timestamp}   ${levelTag} ${ctx} ${correlationTag}${message}${suffix}`;
    
    if (remainingData.length > 0) {
      line += ` ${JSON.stringify(remainingData)}`;
    }
    
    return line + "\n";
  }
}

class ConsoleTransport extends Transport {
  log(entry: LogEntry): void {
    if (this.config.json) {
      process.stdout.write(this.formatJson(entry));
    } else {
      process.stdout.write(this.formatPretty(entry));
    }
  }
}

class FileTransport extends Transport {
  private stream: fs.WriteStream;

  constructor(config: FileTransportConfig) {
    super(config);
    // Ensure directory exists
    const dir = path.dirname(config.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Create stream (append mode)
    this.stream = fs.createWriteStream(config.path, { flags: "a" });
  }

  log(entry: LogEntry): void {
    if (this.config.json !== false) { // Default to JSON for file
      this.stream.write(this.formatJson(entry));
    } else {
      this.stream.write(this.formatPretty(entry));
    }
  }

  close() {
    this.stream.end();
  }
}

/**
 * Logger class for specialized context logging
 */
export class Logger {
  private context: string;
  private config: LoggerConfig;
  private transports: Transport[] = [];
  public static fileTransport: FileTransport | undefined; // Static to share across instances

  constructor(context: string = "App", config: LoggerConfig = {}) {
    this.context = context;
    this.config = config;
    this.initTransports();
  }

  private initTransports() {
    // Console Transport (Default)
    if (this.config.console?.enabled !== false && this.config.enabled !== false) {
      this.transports.push(new ConsoleTransport({
        enabled: true,
        minLevel: this.config.console?.minLevel || this.config.minLevel || "info",
        json: this.config.console?.json ?? this.config.json ?? false, // Fallback to root json config
        correlationId: this.config.console?.correlationId ?? this.config.correlationId // Fallback to root
      }));
    }

    // File Transport
    // Reuse static file transport if path is same, or create new? 
    // For simplicity in v1, we use a static transport if configured in Nural root
    if (this.config.file?.enabled) {
        // If this instance has specific file config, use it.
        // Otherwise, typically the Root Logger initializes the FileTransport.
        // Here we just creating it for this instance if config provided.
        // Optimization: In `nural.ts` we should initialize a static one.
        if (!Logger.fileTransport && this.config.file.path) {
             Logger.fileTransport = new FileTransport(this.config.file);
        }
    }
    
    if (Logger.fileTransport) {
        this.transports.push(Logger.fileTransport);
    }
  }
  
  // Method to manually set file transport (used by Nural class)
  public static setFileTransport(config: FileTransportConfig) {
      if (Logger.fileTransport) {
          Logger.fileTransport.close();
      }
      Logger.fileTransport = new FileTransport(config);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private print(level: LogLevel, message: any, ...args: any[]) {
    // Collect Log attributes
    const correlationId = getContextValue("correlationId");
    
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(),
      pid: process.pid,
      context: this.context,
      message: typeof message === "object" ? JSON.stringify(message) : message,
      correlationId: correlationId,
      data: args.length > 0 ? args : undefined,
    };

    // Dispatch to transports
    for (const transport of this.transports) {
      if (transport.shouldLog(level)) {
        transport.log(entry);
      }
    }
  }

  log(message: any, ...args: any[]) {
    this.info(message, ...args);
  }

  info(message: any, ...args: any[]) {
    this.print("info", message, ...args);
  }

  error(message: any, ...args: any[]) {
    this.print("error", message, ...args);
  }

  warn(message: any, ...args: any[]) {
    this.print("warn", message, ...args);
  }

  debug(message: any, ...args: any[]) {
    this.print("debug", message, ...args);
  }
}
