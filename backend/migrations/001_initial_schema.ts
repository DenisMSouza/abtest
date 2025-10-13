import { Sequelize } from "sequelize";
import { Migration } from "../src/migrations/migration";

const migration: Migration = {
  version: "001",
  name: "initial_schema",

  async up(sequelize: Sequelize): Promise<void> {
    // Create experiments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS experiments (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50),
        startDate DATETIME,
        endDate DATETIME,
        isActive BOOLEAN DEFAULT true,
        successMetric JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create variations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS variations (
        id VARCHAR(255) PRIMARY KEY,
        experimentId VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
        isBaseline BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE
      )
    `);

    // Create user_variations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_variations (
        id VARCHAR(255) PRIMARY KEY,
        experimentId VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        variationId VARCHAR(255) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE,
        FOREIGN KEY (variationId) REFERENCES variations(id) ON DELETE CASCADE,
        UNIQUE(experimentId, userId)
      )
    `);

    // Create success_events table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS success_events (
        id VARCHAR(255) PRIMARY KEY,
        experimentId VARCHAR(255) NOT NULL,
        userId VARCHAR(255),
        sessionId VARCHAR(255),
        variationId VARCHAR(255),
        eventData JSON,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE,
        FOREIGN KEY (variationId) REFERENCES variations(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_experiments_active 
      ON experiments(isActive, startDate, endDate)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_variations_experiment 
      ON variations(experimentId)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_variations_experiment_user 
      ON user_variations(experimentId, userId)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_success_events_experiment 
      ON success_events(experimentId, timestamp)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_success_events_user 
      ON success_events(userId, timestamp)
    `);
  },

  async down(sequelize: Sequelize): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await sequelize.query("DROP TABLE IF EXISTS success_events");
    await sequelize.query("DROP TABLE IF EXISTS user_variations");
    await sequelize.query("DROP TABLE IF EXISTS variations");
    await sequelize.query("DROP TABLE IF EXISTS experiments");
  },
};

export default migration;
