import { Sequelize } from "sequelize";
export interface Migration {
    version: string;
    name: string;
    up: (sequelize: Sequelize) => Promise<void>;
    down: (sequelize: Sequelize) => Promise<void>;
}
export declare class MigrationRunner {
    private sequelize;
    private migrations;
    constructor(sequelize: Sequelize);
    /**
     * Load all migration files
     */
    loadMigrations(): Promise<void>;
    /**
     * Create migrations table if it doesn't exist
     */
    createMigrationsTable(): Promise<void>;
    /**
     * Get executed migrations
     */
    getExecutedMigrations(): Promise<string[]>;
    /**
     * Mark migration as executed
     */
    markMigrationExecuted(version: string, name: string): Promise<void>;
    /**
     * Remove migration from executed list
     */
    markMigrationRolledBack(version: string): Promise<void>;
    /**
     * Run all pending migrations
     */
    up(): Promise<void>;
    /**
     * Rollback the last migration
     */
    down(): Promise<void>;
    /**
     * Get migration status
     */
    status(): Promise<void>;
}
//# sourceMappingURL=migration.d.ts.map