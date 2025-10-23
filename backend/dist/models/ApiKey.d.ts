import { Model, Optional } from "sequelize";
export interface ApiKeyAttributes {
    id: string;
    key: string;
    name: string;
    description?: string;
    isActive: boolean;
    lastUsedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, "id" | "createdAt" | "updatedAt"> {
}
export declare class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
    id: string;
    key: string;
    name: string;
    description?: string;
    isActive: boolean;
    lastUsedAt?: Date;
    expiresAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default ApiKey;
//# sourceMappingURL=ApiKey.d.ts.map