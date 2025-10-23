"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.requestLogger = exports.logger = exports.Logger = exports.LogLevel = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(level = LogLevel.INFO, enableConsole = true, enableFile = false, filePath) {
        this.level = level;
        this.enableConsole = enableConsole;
        this.enableFile = enableFile;
        this.filePath = filePath;
        if (this.enableFile && this.filePath) {
            this.setupFileLogging();
        }
    }
    setupFileLogging() {
        if (!this.filePath)
            return;
        // Ensure log directory exists
        const logDir = (0, path_1.join)(this.filePath, "..");
        if (!(0, fs_1.existsSync)(logDir)) {
            (0, fs_1.mkdirSync)(logDir, { recursive: true });
        }
        // Create write stream
        this.fileStream = (0, fs_1.createWriteStream)(this.filePath, { flags: "a" });
    }
    formatLogEntry(level, message, data, error, context) {
        const entry = {
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
            if (context.requestId)
                entry.requestId = context.requestId;
            if (context.userId)
                entry.userId = context.userId;
            if (context.experimentId)
                entry.experimentId = context.experimentId;
        }
        return entry;
    }
    shouldLog(level) {
        return level <= this.level;
    }
    writeLog(entry) {
        const logLine = JSON.stringify(entry) + "\n";
        if (this.enableConsole) {
            const color = this.getColorForLevel(entry.level);
            const reset = "\x1b[0m";
            console.log(`${color}[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${reset}`);
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
    getColorForLevel(level) {
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
    error(message, error, data, context) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        const entry = this.formatLogEntry("error", message, data, error, context);
        this.writeLog(entry);
    }
    warn(message, data, context) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        const entry = this.formatLogEntry("warn", message, data, undefined, context);
        this.writeLog(entry);
    }
    info(message, data, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const entry = this.formatLogEntry("info", message, data, undefined, context);
        this.writeLog(entry);
    }
    debug(message, data, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const entry = this.formatLogEntry("debug", message, data, undefined, context);
        this.writeLog(entry);
    }
    close() {
        if (this.fileStream) {
            this.fileStream.end();
        }
    }
}
exports.Logger = Logger;
// Create default logger instance
exports.logger = new Logger(process.env.LOG_LEVEL || LogLevel.INFO, process.env.LOG_CONSOLE !== "false", process.env.LOG_FILE === "true", process.env.LOG_FILE_PATH);
// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = req.headers["x-request-id"] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    req.startTime = start;
    // Log request
    exports.logger.info("Request started", {
        method: req.method,
        url: req.url,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    }, { requestId });
    // Log response
    res.on("finish", () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? "error" : "info";
        if (level === "error") {
            exports.logger.error("Request completed", undefined, {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
            }, { requestId });
        }
        else {
            exports.logger.info("Request completed", {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
            }, { requestId });
        }
    });
    next();
};
exports.requestLogger = requestLogger;
// Error logging middleware
const errorLogger = (error, req, res, next) => {
    exports.logger.error("Unhandled error", error, {
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        params: req.params,
    }, { requestId: req.requestId });
    next(error);
};
exports.errorLogger = errorLogger;
// Graceful shutdown
process.on("SIGTERM", () => {
    exports.logger.info("SIGTERM received, shutting down gracefully");
    exports.logger.close();
    process.exit(0);
});
process.on("SIGINT", () => {
    exports.logger.info("SIGINT received, shutting down gracefully");
    exports.logger.close();
    process.exit(0);
});
//# sourceMappingURL=logger.js.map