import sequelize from "../src/config/database";
import { Experiment, Variation } from "../src/models";

const seedDatabase = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");

    // Create sample experiment
    const experiment = await Experiment.create({
      name: "Button Color Test",
      description: "Test different button colors to see which performs better",
      version: "1.0.0",
      isActive: true,
    });

    // Create variations
    await Variation.bulkCreate([
      {
        experimentId: experiment.id,
        name: "baseline",
        weight: 0.5,
        isBaseline: true,
      },
      {
        experimentId: experiment.id,
        name: "red",
        weight: 0.5,
        isBaseline: false,
      },
    ]);

    console.log("Sample experiment created:", experiment.id);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
