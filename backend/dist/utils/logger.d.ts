export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
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
    [key: string]: any;
}
export declare class Logger {
    private level;
    private enableConsole;
    private enableFile;
    private filePath?;
    private fileStream?;
    constructor(level?: LogLevel, enableConsole?: boolean, enableFile?: boolean, filePath?: string);
    private setupFileLogging;
    private formatLogEntry;
    private shouldLog;
    private writeLog;
    private getColorForLevel;
    error(message: string, error?: Error, data?: any, context?: any): void;
    warn(message: string, data?: any, context?: any): void;
    info(message: string, data?: any, context?: any): void;
    debug(message: string, data?: any, context?: any): void;
    close(): void;
}
export declare const logger: Logger;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export declare const errorLogger: (error: Error, req: any, res: any, next: any) => void;
//# sourceMappingURL=logger.d.ts.map