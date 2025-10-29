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
const security_1 = require("./middleware/security");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "127.0.0.1"; // Bind to localhost by default
// CORS configuration - MUST be before other middleware to handle preflight requests
// Two separate environment variables for better clarity:
// - DASHBOARD_ORIGINS: Dashboard origins (default: localhost:3000)
// - HOOK_ORIGINS: Frontend origins where the hook will run (comma-separated)
const getAllowedOrigins = () => {
    const origins = [];
    // Dashboard origins (always included)
    const dashboardOrigins = process.env.DASHBOARD_ORIGINS ||
        "http://localhost:3000,http://127.0.0.1:3000";
    const dashboardList = dashboardOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    origins.push(...dashboardList);
    // Hook origins (optional - where frontend apps using the hook will run)
    if (process.env.HOOK_ORIGINS) {
        const hookOrigins = process.env.HOOK_ORIGINS.split(",")
            .map((origin) => origin.trim())
            .filter((origin) => origin.length > 0);
        origins.push(...hookOrigins);
    }
    // Remove duplicates and return
    return [...new Set(origins)];
};
const allowedOrigins = getAllowedOrigins();
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
    optionsSuccessStatus: 200,
}));
// Security middleware stack (order matters!)
app.use(security_1.securityHeaders);
app.use(security_1.compressionMiddleware);
app.use(security_1.securityLogger);
app.use(security_1.validateRequest);
// Rate limiting
app.use((0, security_1.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
}));
// Slow down after rate limit
app.use((0, security_1.createSlowDown)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500,
}));
// Body parsing with size limits
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Routes
// Public API (for external developers using the SDK)
app.use("/api", public_1.default);
// Internal API (for dashboard and admin) - Multiple protection layers
// Option 1: Use localhostOnly middleware (current approach)
app.use("/api/internal/experiments", security_1.localhostOnly, experiments_1.default);
app.use("/api/internal/api-keys", security_1.localhostOnly, apiKeys_1.default);
// Option 2: Use API key validation (more secure for production)
// Uncomment these lines and comment out the localhostOnly lines above if you prefer API key auth
// app.use("/api/internal/experiments", validateApiKey, experimentRoutes);
// app.use("/api/internal/api-keys", validateApiKey, apiKeyRoutes);
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
        // Start server - Bind to localhost for security
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server running on http://${HOST}:${PORT}`);
            console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
            console.log(`📡 Public API: http://${HOST}:${PORT}/api`);
            console.log(`🔐 Internal API: http://${HOST}:${PORT}/api/internal/`);
            console.log(`🔑 API Keys: http://${HOST}:${PORT}/api/internal/api-keys`);
            console.log(`🛡️  Security: Server bound to localhost only`);
            console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
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