import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import experimentRoutes from "./routes/experiments";
import publicRoutes from "./routes/public";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Public API (for external developers using the SDK)
app.use("/api", publicRoutes);

// Internal API (for dashboard and admin)
app.use("/api/internal/experiments", experimentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: false }); // Set to true to recreate tables
    console.log("Database synced successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
