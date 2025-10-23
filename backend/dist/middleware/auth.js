"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = validateApiKey;
exports.createApiKeyResponse = createApiKeyResponse;
const apiKeyService_1 = require("../services/apiKeyService");
async function validateApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            error: "Missing Authorization header",
            message: "Please provide an API key in the Authorization header",
        });
    }
    const apiKey = authHeader.replace("Bearer ", "");
    try {
        const isValid = await apiKeyService_1.ApiKeyService.validateApiKey(apiKey);
        if (!isValid) {
            console.log(`API key validation failed: ${apiKey.substring(0, 10)}...`);
            return res.status(401).json({
                error: "Invalid API key",
                message: "The provided API key is not valid",
            });
        }
        console.log(`API key validation passed`);
        next();
    }
    catch (error) {
        console.error("Error validating API key:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "Failed to validate API key",
        });
    }
}
function createApiKeyResponse(message, status = 401) {
    return { error: message, status };
}
//# sourceMappingURL=auth.js.map