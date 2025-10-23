import { Options } from "sequelize";
export interface ProductionConfig {
    database: Options;
    server: {
        port: number;
        host: string;
        cors: {
            origin: string | string[];
            credentials: boolean;
        };
    };
    logging: {
        level: "error" | "warn" | "info" | "debug";
        enableConsole: boolean;
        enableFile: boolean;
        filePath?: string;
    };
    security: {
        rateLimit: {
            windowMs: number;
            max: number;
        };
        helmet: boolean;
    };
    monitoring: {
        healthCheck: {
            enabled: boolean;
            path: string;
        };
        metrics: {
            enabled: boolean;
            path: string;
        };
    };
}
export declare const productionConfig: ProductionConfig;
export declare const getConfig: () => ProductionConfig;
//# sourceMappingURL=production.d.ts.map