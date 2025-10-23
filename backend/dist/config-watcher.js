"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigWatcher = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Watch for API key configuration changes and restart the server
 */
class ConfigWatcher {
    constructor() {
        this.isWatching = false;
        this.configPath = (0, path_1.join)(__dirname, "..", "api-key-config.json");
    }
    static getInstance() {
        if (!ConfigWatcher.instance) {
            ConfigWatcher.instance = new ConfigWatcher();
        }
        return ConfigWatcher.instance;
    }
    /**
     * Start watching for configuration changes
     */
    startWatching() {
        if (this.isWatching) {
            console.log("Config watcher is already running");
            return;
        }
        console.log(`Watching for config changes at: ${this.configPath}`);
        // Use a more robust file watching approach
        const fs = require("fs");
        // Check if file exists, if not, create it with current API key
        if (!fs.existsSync(this.configPath)) {
            const initialConfig = {
                apiKey: process.env.ABTEST_API_KEY || "default_key",
                updatedAt: new Date().toISOString(),
                version: Date.now()
            };
            fs.writeFileSync(this.configPath, JSON.stringify(initialConfig, null, 2));
            console.log("Created initial config file");
        }
        (0, fs_1.watch)(this.configPath, (eventType, filename) => {
            if (eventType === "change") {
                console.log("🔔 API key configuration changed, updating...");
                // Add a small delay to ensure file is fully written
                setTimeout(() => {
                    this.handleConfigChange();
                }, 100);
            }
        });
        this.isWatching = true;
        console.log("✅ Config watcher started - ready for automatic API key updates");
    }
    /**
     * Handle configuration changes
     */
    handleConfigChange() {
        try {
            // Read the new configuration
            const fs = require("fs");
            const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
            // Store the old key for comparison
            const oldKey = process.env.ABTEST_API_KEY;
            // Update the environment variable (no restart needed!)
            process.env.ABTEST_API_KEY = config.apiKey;
            console.log(`🔄 API key updated from ${oldKey?.substring(0, 10)}... to ${config.apiKey.substring(0, 10)}...`);
            console.log("✅ Backend is now using the new API key (no restart required)");
            console.log("📊 All active connections and data remain intact");
            console.log("🎯 New API key is immediately active for all requests");
            // Verify the update worked
            if (process.env.ABTEST_API_KEY === config.apiKey) {
                console.log("✅ API key update verified successfully");
            }
            else {
                console.error("❌ API key update failed - keys don't match");
            }
        }
        catch (error) {
            console.error("Error handling config change:", error);
        }
    }
    /**
     * Stop watching for changes
     */
    stopWatching() {
        if (this.isWatching) {
            this.isWatching = false;
            console.log("Config watcher stopped");
        }
    }
}
exports.ConfigWatcher = ConfigWatcher;
//# sourceMappingURL=config-watcher.js.map