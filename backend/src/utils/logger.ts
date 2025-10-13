import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  experimentId?: string;
}

export class Logger {
  private level: LogLevel;
  private enableConsole: boolean;
  private enableFile: boolean;
  private filePath?: string;
  private fileStream?: NodeJS.WritableStream;

  constructor(
    level: LogLevel = LogLevel.INFO,
    enableConsole: boolean = true,
    enableFile: boolean = false,
    filePath?: string
  ) {
    this.level = level;
    this.enableConsole = enableConsole;
    this.enableFile = enableFile;
    this.filePath = filePath;

    if (this.enableFile && this.filePath) {
      this.setupFileLogging();
    }
  }

  private setupFileLogging(): void {
    if (!this.filePath) return;

    // Ensure log directory exists
    const logDir = join(this.filePath, "..");
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // Create write stream
    this.fileStream = createWriteStream(this.filePath, { flags: "a" });
  }

  private formatLogEntry(
    level: string,
    message: string,
    data?: any,
    error?: Error,
    context?: any
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (data) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (context) {
      if (context.requestId) entry.requestId = context.requestId;
      if (context.userId) entry.userId = context.userId;
      if (context.experimentId) entry.experimentId = context.experimentId;
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private writeLog(entry: LogEntry): void {
    const logLine = JSON.stringify(entry) + "\n";

    if (this.enableConsole) {
      const color = this.getColorForLevel(entry.level);
      const reset = "\x1b[0m";
      console.log(
        `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}: ${
          entry.message
        }${reset}`
      );

      if (entry.data) {
        console.log("  Data:", entry.data);
      }

      if (entry.error) {
        console.error("  Error:", entry.error);
      }
    }

    if (this.enableFile && this.fileStream) {
      this.fileStream.write(logLine);
    }
  }

  private getColorForLevel(level: string): string {
    switch (level.toLowerCase()) {
      case "error":
        return "\x1b[31m"; // Red
      case "warn":
        return "\x1b[33m"; // Yellow
      case "info":
        return "\x1b[36m"; // Cyan
      case "debug":
        return "\x1b[90m"; // Gray
      default:
        return "\x1b[0m"; // Reset
    }
  }

  public error(
    message: string,
    error?: Error,
    data?: any,
    context?: any
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.formatLogEntry("error", message, data, error, context);
    this.writeLog(entry);
  }

  public warn(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.formatLogEntry(
      "warn",
      message,
      data,
      undefined,
      context
    );
    this.writeLog(entry);
  }

  public info(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.formatLogEntry(
      "info",
      message,
      data,
      undefined,
      context
    );
    this.writeLog(entry);
  }

  public debug(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.formatLogEntry(
      "debug",
      message,
      data,
      undefined,
      context
    );
    this.writeLog(entry);
  }

  public close(): void {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

// Create default logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as any) || LogLevel.INFO,
  process.env.LOG_CONSOLE !== "false",
  process.env.LOG_FILE === "true",
  process.env.LOG_FILE_PATH
);

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const requestId =
    req.headers["x-request-id"] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;
  req.startTime = start;

  // Log request
  logger.info(
    "Request started",
    {
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    },
    { requestId }
  );

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "error" : "info";

    logger[level](
      "Request completed",
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      { requestId }
    );
  });

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: any, res: any, next: any) => {
  logger.error(
    "Unhandled error",
    error,
    {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    { requestId: req.requestId }
  );

  next(error);
};

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  logger.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  logger.close();
  process.exit(0);
});
