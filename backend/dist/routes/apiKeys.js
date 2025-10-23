"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const localhostOnly_1 = require("../middleware/localhostOnly");
const apiKeyService_1 = require("../services/apiKeyService");
const router = express_1.default.Router();
// Get all API keys
router.get("/", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const apiKeys = await apiKeyService_1.ApiKeyService.getAllApiKeys();
        res.json(apiKeys);
    }
    catch (error) {
        console.error("Error fetching API keys:", error);
        res.status(500).json({ error: "Failed to fetch API keys" });
    }
});
// Get API key statistics
router.get("/stats", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const stats = await apiKeyService_1.ApiKeyService.getApiKeyStats();
        res.json(stats);
    }
    catch (error) {
        console.error("Error fetching API key stats:", error);
        res.status(500).json({ error: "Failed to fetch API key statistics" });
    }
});
// Create a new API key
router.post("/", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const { name, description, expiresAt } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }
        const apiKey = await apiKeyService_1.ApiKeyService.createApiKey(name, description, expiresAt ? new Date(expiresAt) : undefined);
        res.status(201).json(apiKey);
    }
    catch (error) {
        console.error("Error creating API key:", error);
        res.status(500).json({ error: "Failed to create API key" });
    }
});
// Get API key by ID
router.get("/:id", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = await apiKeyService_1.ApiKeyService.getApiKeyById(id);
        if (!apiKey) {
            return res.status(404).json({ error: "API key not found" });
        }
        res.json(apiKey);
    }
    catch (error) {
        console.error("Error fetching API key:", error);
        res.status(500).json({ error: "Failed to fetch API key" });
    }
});
// Deactivate API key
router.patch("/:id/deactivate", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await apiKeyService_1.ApiKeyService.deactivateApiKey(id);
        if (!success) {
            return res.status(404).json({ error: "API key not found" });
        }
        res.json({ message: "API key deactivated successfully" });
    }
    catch (error) {
        console.error("Error deactivating API key:", error);
        res.status(500).json({ error: "Failed to deactivate API key" });
    }
});
// Reactivate API key
router.patch("/:id/reactivate", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await apiKeyService_1.ApiKeyService.reactivateApiKey(id);
        if (!success) {
            return res.status(404).json({ error: "API key not found" });
        }
        res.json({ message: "API key reactivated successfully" });
    }
    catch (error) {
        console.error("Error reactivating API key:", error);
        res.status(500).json({ error: "Failed to reactivate API key" });
    }
});
// Delete API key
router.delete("/:id", localhostOnly_1.localhostOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await apiKeyService_1.ApiKeyService.deleteApiKey(id);
        if (!success) {
            return res.status(404).json({ error: "API key not found" });
        }
        res.json({ message: "API key deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting API key:", error);
        res.status(500).json({ error: "Failed to delete API key" });
    }
});
exports.default = router;
//# sourceMappingURL=apiKeys.js.map