/**
 * Zero-Dependency Logger
 * Lightweight, colorful, and powerful logging system
 */

import util from "util";

// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export interface LoggerConfig {
  /** Enable/disable logging */
  enabled?: boolean;
  /** Minimum log level */
  minLevel?: "log" | "error" | "warn" | "debug";
  /** Show timestamp */
  timestamp?: boolean;
}

/**
 * Logger class for specialized context logging
 */
export class Logger {
  private context: string;
  private config: LoggerConfig;

  constructor(context: string = "System", config: LoggerConfig = {}) {
    this.context = context;
    this.config = { enabled: true, timestamp: true, ...config };
  }

  private getTimestamp() {
    if (!this.config.timestamp) return "";
    return new Date().toISOString();
  }

  private print(level: string, message: any, color: string, ...args: any[]) {
    if (this.config.enabled === false) return;

    const pid = process.pid;
    const timestamp = this.getTimestamp();
    const ctx = `[${colors.yellow}${this.context}${colors.reset}]`;
    
    const format = (msg: any) => {
      if (typeof msg === 'string') return msg;
      return util.inspect(msg, { colors: true, depth: null, breakLength: Infinity });
    };

    const formattedMessage = format(message);

    // Format: [Nural] 1234 - 10/20/2025... [Context] Message
    process.stdout.write(
      `${colors.green}[Nural]${colors.reset} ${colors.gray}${pid}${colors.reset}  - ` +
        `${timestamp}   ${ctx} ${color}${formattedMessage}${colors.reset}\n`,
    );
     if (args.length > 0) {
      args.forEach(arg => {
        process.stdout.write(`${format(arg)}\n`);
      });
    }
  }

  log(message: any, ...args: any[]) {
    this.print("LOG", message, colors.green, ...args);
  }

  info(message: any, ...args: any[]) {
    this.print("INFO", message, colors.cyan, ...args);
  }

  error(message: any, ...args: any[]) {
    this.print("ERROR", message, colors.red, ...args);
  }

  warn(message: any, ...args: any[]) {
    this.print("WARN", message, colors.yellow, ...args);
  }

  debug(message: any, ...args: any[]) {
    this.print("DEBUG", message, colors.magenta, ...args);
  }
}
