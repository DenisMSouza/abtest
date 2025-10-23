"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const crypto_1 = require("crypto");
const ApiKey_1 = __importDefault(require("../models/ApiKey"));
class ApiKeyService {
    /**
     * Generate a secure API key
     */
    static generateApiKey() {
        const randomPart = (0, crypto_1.randomBytes)(32).toString("hex");
        return `abtest_${randomPart}`;
    }
    /**
     * Create a new API key
     */
    static async createApiKey(name, description, expiresAt) {
        const key = this.generateApiKey();
        return await ApiKey_1.default.create({
            key,
            name,
            description,
            expiresAt,
            isActive: true,
        });
    }
    /**
     * Validate an API key
     */
    static async validateApiKey(apiKey) {
        try {
            const keyRecord = await ApiKey_1.default.findOne({
                where: {
                    key: apiKey,
                    isActive: true,
                },
            });
            if (!keyRecord) {
                return false;
            }
            // Check if key is expired
            if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
                return false;
            }
            // Update last used timestamp
            await keyRecord.update({
                lastUsedAt: new Date(),
            });
            return true;
        }
        catch (error) {
            console.error("Error validating API key:", error);
            return false;
        }
    }
    /**
     * Get all API keys
     */
    static async getAllApiKeys() {
        return await ApiKey_1.default.findAll({
            order: [["createdAt", "DESC"]],
        });
    }
    /**
     * Get API key by ID
     */
    static async getApiKeyById(id) {
        return await ApiKey_1.default.findByPk(id);
    }
    /**
     * Deactivate an API key
     */
    static async deactivateApiKey(id) {
        try {
            const keyRecord = await ApiKey_1.default.findByPk(id);
            if (!keyRecord) {
                return false;
            }
            await keyRecord.update({ isActive: false });
            return true;
        }
        catch (error) {
            console.error("Error deactivating API key:", error);
            return false;
        }
    }
    /**
     * Reactivate an API key
     */
    static async reactivateApiKey(id) {
        try {
            const keyRecord = await ApiKey_1.default.findByPk(id);
            if (!keyRecord) {
                return false;
            }
            await keyRecord.update({ isActive: true });
            return true;
        }
        catch (error) {
            console.error("Error reactivating API key:", error);
            return false;
        }
    }
    /**
     * Delete an API key
     */
    static async deleteApiKey(id) {
        try {
            const result = await ApiKey_1.default.destroy({
                where: { id },
            });
            return result > 0;
        }
        catch (error) {
            console.error("Error deleting API key:", error);
            return false;
        }
    }
    /**
     * Get API key usage statistics
     */
    static async getApiKeyStats() {
        const total = await ApiKey_1.default.count();
        const active = await ApiKey_1.default.count({ where: { isActive: true } });
        const inactive = await ApiKey_1.default.count({ where: { isActive: false } });
        const expired = await ApiKey_1.default.count({
            where: {
                expiresAt: {
                    [require("sequelize").Op.lt]: new Date(),
                },
            },
        });
        return { total, active, inactive, expired };
    }
}
exports.ApiKeyService = ApiKeyService;
//# sourceMappingURL=apiKeyService.js.map