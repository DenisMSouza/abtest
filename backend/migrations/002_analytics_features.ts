import { Sequelize } from "sequelize";
import { Migration } from "../src/migrations/migration";

const migration: Migration = {
  version: "002",
  name: "analytics_features",

  async up(sequelize: Sequelize): Promise<void> {
    // Add analytics fields to experiments table
    await sequelize.query(`
      ALTER TABLE experiments 
      ADD COLUMN IF NOT EXISTS trafficAllocation DECIMAL(3,2) DEFAULT 1.00
    `);

    await sequelize.query(`
      ALTER TABLE experiments 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'
    `);

    await sequelize.query(`
      ALTER TABLE experiments 
      ADD COLUMN IF NOT EXISTS createdBy VARCHAR(255)
    `);

    // Create experiment_views table for tracking page views
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS experiment_views (
        id VARCHAR(255) PRIMARY KEY,
        experimentId VARCHAR(255) NOT NULL,
        userId VARCHAR(255),
        sessionId VARCHAR(255),
        variationId VARCHAR(255),
        page VARCHAR(255),
        referrer VARCHAR(500),
        userAgent TEXT,
        ipAddress VARCHAR(45),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE,
        FOREIGN KEY (variationId) REFERENCES variations(id) ON DELETE CASCADE
      )
    `);

    // Create custom_events table for tracking custom events
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_events (
        id VARCHAR(255) PRIMARY KEY,
        experimentId VARCHAR(255) NOT NULL,
        userId VARCHAR(255),
        sessionId VARCHAR(255),
        variationId VARCHAR(255),
        eventName VARCHAR(255) NOT NULL,
        eventData JSON,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE,
        FOREIGN KEY (variationId) REFERENCES variations(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for new tables
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_experiment_views_experiment 
      ON experiment_views(experimentId, timestamp)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_experiment_views_user 
      ON experiment_views(userId, timestamp)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_events_experiment 
      ON custom_events(experimentId, eventName, timestamp)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_events_user 
      ON custom_events(userId, timestamp)
    `);

    // Add status check constraint
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS experiments_new (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50),
        startDate DATETIME,
        endDate DATETIME,
        isActive BOOLEAN DEFAULT true,
        successMetric JSON,
        trafficAllocation DECIMAL(3,2) DEFAULT 1.00,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
        createdBy VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Copy data from old table to new table
    await sequelize.query(`
      INSERT INTO experiments_new 
      SELECT 
        id, name, description, version, startDate, endDate, isActive, 
        successMetric, 1.00 as trafficAllocation, 
        CASE 
          WHEN isActive = 1 THEN 'running' 
          ELSE 'completed' 
        END as status,
        NULL as createdBy,
        createdAt, updatedAt
      FROM experiments
    `);

    // Drop old table and rename new table
    await sequelize.query("DROP TABLE experiments");
    await sequelize.query("ALTER TABLE experiments_new RENAME TO experiments");

    // Recreate foreign key constraints
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_experiments_active 
      ON experiments(status, startDate, endDate)
    `);
  },

  async down(sequelize: Sequelize): Promise<void> {
    // Drop new tables
    await sequelize.query("DROP TABLE IF EXISTS custom_events");
    await sequelize.query("DROP TABLE IF EXISTS experiment_views");

    // Revert experiments table changes
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS experiments_old (
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

    await sequelize.query(`
      INSERT INTO experiments_old 
      SELECT 
        id, name, description, version, startDate, endDate, 
        CASE WHEN status = 'running' THEN 1 ELSE 0 END as isActive,
        successMetric, createdAt, updatedAt
      FROM experiments
    `);

    await sequelize.query("DROP TABLE experiments");
    await sequelize.query("ALTER TABLE experiments_old RENAME TO experiments");
  },
};

export default migration;
