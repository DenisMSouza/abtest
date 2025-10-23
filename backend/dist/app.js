"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const experiments_1 = __importDefault(require("./routes/experiments"));
const public_1 = __importDefault(require("./routes/public"));
const apiKeys_1 = __importDefault(require("./routes/apiKeys"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
// Public API (for external developers using the SDK)
app.use("/api", public_1.default);
// Internal API (for dashboard and admin)
app.use("/api/internal/experiments", experiments_1.default);
app.use("/api/internal/api-keys", apiKeys_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Initialize database and start server
const startServer = async () => {
    try {
        // Sync database
        await database_1.default.sync({ force: false }); // Set to true to recreate tables
        console.log("Database synced successfully");
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`API base: http://localhost:${PORT}/api`);
            console.log(`API Keys: http://localhost:${PORT}/api/internal/api-keys`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map