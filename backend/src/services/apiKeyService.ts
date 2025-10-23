import { randomBytes } from "crypto";
import ApiKey from "../models/ApiKey";

export class ApiKeyService {
  /**
   * Generate a secure API key
   */
  static generateApiKey(): string {
    const randomPart = randomBytes(32).toString("hex");
    return `abtest_${randomPart}`;
  }

  /**
   * Create a new API key
   */
  static async createApiKey(
    name: string,
    description?: string,
    expiresAt?: Date
  ): Promise<ApiKey> {
    const key = this.generateApiKey();

    return await ApiKey.create({
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
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const keyRecord = await ApiKey.findOne({
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
    } catch (error) {
      console.error("Error validating API key:", error);
      return false;
    }
  }

  /**
   * Get all API keys
   */
  static async getAllApiKeys(): Promise<ApiKey[]> {
    return await ApiKey.findAll({
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Get API key by ID
   */
  static async getApiKeyById(id: string): Promise<ApiKey | null> {
    return await ApiKey.findByPk(id);
  }

  /**
   * Deactivate an API key
   */
  static async deactivateApiKey(id: string): Promise<boolean> {
    try {
      const keyRecord = await ApiKey.findByPk(id);
      if (!keyRecord) {
        return false;
      }

      await keyRecord.update({ isActive: false });
      return true;
    } catch (error) {
      console.error("Error deactivating API key:", error);
      return false;
    }
  }

  /**
   * Reactivate an API key
   */
  static async reactivateApiKey(id: string): Promise<boolean> {
    try {
      const keyRecord = await ApiKey.findByPk(id);
      if (!keyRecord) {
        return false;
      }

      await keyRecord.update({ isActive: true });
      return true;
    } catch (error) {
      console.error("Error reactivating API key:", error);
      return false;
    }
  }

  /**
   * Delete an API key
   */
  static async deleteApiKey(id: string): Promise<boolean> {
    try {
      const result = await ApiKey.destroy({
        where: { id },
      });
      return result > 0;
    } catch (error) {
      console.error("Error deleting API key:", error);
      return false;
    }
  }

  /**
   * Get API key usage statistics
   */
  static async getApiKeyStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
  }> {
    const total = await ApiKey.count();
    const active = await ApiKey.count({ where: { isActive: true } });
    const inactive = await ApiKey.count({ where: { isActive: false } });
    const expired = await ApiKey.count({
      where: {
        expiresAt: {
          [require("sequelize").Op.lt]: new Date(),
        },
      },
    });

    return { total, active, inactive, expired };
  }
}
