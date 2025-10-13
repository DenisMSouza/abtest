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

export const productionConfig: ProductionConfig = {
  database: {
    dialect: "sqlite",
    storage: process.env.DB_PATH || "/app/data/abtest.db",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
  },
  server: {
    port: parseInt(process.env.PORT || "3001", 10),
    host: process.env.HOST || "0.0.0.0",
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || "info",
    enableConsole: process.env.LOG_CONSOLE !== "false",
    enableFile: process.env.LOG_FILE === "true",
    filePath: process.env.LOG_FILE_PATH || "/app/logs/app.log",
  },
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // limit each IP to 100 requests per windowMs
    },
    helmet: process.env.HELMET !== "false",
  },
  monitoring: {
    healthCheck: {
      enabled: process.env.HEALTH_CHECK !== "false",
      path: process.env.HEALTH_CHECK_PATH || "/health",
    },
    metrics: {
      enabled: process.env.METRICS === "true",
      path: process.env.METRICS_PATH || "/metrics",
    },
  },
};

// Environment-specific configurations
export const getConfig = (): ProductionConfig => {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return {
        ...productionConfig,
        database: {
          ...productionConfig.database,
          logging: false,
        },
        logging: {
          ...productionConfig.logging,
          level: "warn",
        },
      };

    case "staging":
      return {
        ...productionConfig,
        database: {
          ...productionConfig.database,
          logging: console.log,
        },
        logging: {
          ...productionConfig.logging,
          level: "info",
        },
      };

    case "development":
    default:
      return {
        ...productionConfig,
        database: {
          ...productionConfig.database,
          storage: "./database.sqlite",
          logging: console.log,
        },
        logging: {
          ...productionConfig.logging,
          level: "debug",
        },
      };
  }
};
