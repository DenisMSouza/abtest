"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunner = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class MigrationRunner {
    constructor(sequelize) {
        this.migrations = [];
        this.sequelize = sequelize;
    }
    /**
     * Load all migration files
     */
    async loadMigrations() {
        const migrationsDir = (0, path_1.join)(__dirname, "..", "..", "migrations");
        try {
            const files = (0, fs_1.readdirSync)(migrationsDir)
                .filter((file) => file.endsWith(".ts") && file !== "migration.ts")
                .sort();
            for (const file of files) {
                const migrationPath = (0, path_1.join)(migrationsDir, file);
                const migration = require(migrationPath).default;
                if (migration && migration.version && migration.name) {
                    this.migrations.push(migration);
                }
            }
        }
        catch (error) {
            console.warn("No migrations directory found or error loading migrations:", error);
        }
    }
    /**
     * Create migrations table if it doesn't exist
     */
    async createMigrationsTable() {
        await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }
    /**
     * Get executed migrations
     */
    async getExecutedMigrations() {
        const [results] = await this.sequelize.query("SELECT version FROM migrations ORDER BY version");
        return results.map((row) => row.version);
    }
    /**
     * Mark migration as executed
     */
    async markMigrationExecuted(version, name) {
        await this.sequelize.query("INSERT INTO migrations (version, name) VALUES (?, ?)", {
            replacements: [version, name],
        });
    }
    /**
     * Remove migration from executed list
     */
    async markMigrationRolledBack(version) {
        await this.sequelize.query("DELETE FROM migrations WHERE version = ?", {
            replacements: [version],
        });
    }
    /**
     * Run all pending migrations
     */
    async up() {
        await this.createMigrationsTable();
        await this.loadMigrations();
        const executedMigrations = await this.getExecutedMigrations();
        const pendingMigrations = this.migrations.filter((migration) => !executedMigrations.includes(migration.version));
        console.log(`Found ${pendingMigrations.length} pending migrations`);
        for (const migration of pendingMigrations) {
            console.log(`Running migration ${migration.version}: ${migration.name}`);
            try {
                await this.sequelize.transaction(async (transaction) => {
                    await migration.up(this.sequelize);
                    await this.markMigrationExecuted(migration.version, migration.name);
                });
                console.log(`✓ Migration ${migration.version} completed successfully`);
            }
            catch (error) {
                console.error(`✗ Migration ${migration.version} failed:`, error);
                throw error;
            }
        }
        console.log("All migrations completed successfully");
    }
    /**
     * Rollback the last migration
     */
    async down() {
        await this.createMigrationsTable();
        await this.loadMigrations();
        const executedMigrations = await this.getExecutedMigrations();
        const lastMigration = executedMigrations[executedMigrations.length - 1];
        if (!lastMigration) {
            console.log("No migrations to rollback");
            return;
        }
        const migration = this.migrations.find((m) => m.version === lastMigration);
        if (!migration) {
            console.error(`Migration ${lastMigration} not found`);
            return;
        }
        console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
        try {
            await this.sequelize.transaction(async (transaction) => {
                await migration.down(this.sequelize);
                await this.markMigrationRolledBack(migration.version);
            });
            console.log(`✓ Migration ${migration.version} rolled back successfully`);
        }
        catch (error) {
            console.error(`✗ Rollback of migration ${migration.version} failed:`, error);
            throw error;
        }
    }
    /**
     * Get migration status
     */
    async status() {
        await this.createMigrationsTable();
        await this.loadMigrations();
        const executedMigrations = await this.getExecutedMigrations();
        console.log("\nMigration Status:");
        console.log("================");
        for (const migration of this.migrations) {
            const status = executedMigrations.includes(migration.version) ? "✓" : "✗";
            console.log(`${status} ${migration.version}: ${migration.name}`);
        }
        console.log(`\nTotal: ${this.migrations.length} migrations`);
        console.log(`Executed: ${executedMigrations.length}`);
        console.log(`Pending: ${this.migrations.length - executedMigrations.length}`);
    }
}
exports.MigrationRunner = MigrationRunner;
//# sourceMappingURL=migration.js.map