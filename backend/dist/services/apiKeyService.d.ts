import ApiKey from "../models/ApiKey";
export declare class ApiKeyService {
    /**
     * Generate a secure API key
     */
    static generateApiKey(): string;
    /**
     * Create a new API key
     */
    static createApiKey(name: string, description?: string, expiresAt?: Date): Promise<ApiKey>;
    /**
     * Validate an API key
     */
    static validateApiKey(apiKey: string): Promise<boolean>;
    /**
     * Get all API keys
     */
    static getAllApiKeys(): Promise<ApiKey[]>;
    /**
     * Get API key by ID
     */
    static getApiKeyById(id: string): Promise<ApiKey | null>;
    /**
     * Deactivate an API key
     */
    static deactivateApiKey(id: string): Promise<boolean>;
    /**
     * Reactivate an API key
     */
    static reactivateApiKey(id: string): Promise<boolean>;
    /**
     * Delete an API key
     */
    static deleteApiKey(id: string): Promise<boolean>;
    /**
     * Get API key usage statistics
     */
    static getApiKeyStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        expired: number;
    }>;
}
//# sourceMappingURL=apiKeyService.d.ts.map