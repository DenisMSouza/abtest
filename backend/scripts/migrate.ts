#!/usr/bin/env ts-node

import { Sequelize } from "sequelize";
import { MigrationRunner } from "../src/migrations/migration";
import { config } from "../src/config/database";

async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log("Usage: npm run migrate [up|down|status]");
    process.exit(1);
  }

  // Create database connection
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: config.storage,
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }

  const migrationRunner = new MigrationRunner(sequelize);

  try {
    switch (command) {
      case "up":
        console.log("Running migrations...");
        await migrationRunner.up();
        break;

      case "down":
        console.log("Rolling back last migration...");
        await migrationRunner.down();
        break;

      case "status":
        await migrationRunner.status();
        break;

      default:
        console.log("Unknown command. Use: up, down, or status");
        process.exit(1);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main().catch(console.error);
