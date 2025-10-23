import { Model, Optional } from "sequelize";
export interface UserVariationAttributes {
    id: string;
    experimentId: string;
    variationId: string;
    userId?: string;
    sessionId?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserVariationCreationAttributes extends Optional<UserVariationAttributes, "id" | "createdAt" | "updatedAt"> {
}
export declare class UserVariation extends Model<UserVariationAttributes, UserVariationCreationAttributes> implements UserVariationAttributes {
    id: string;
    experimentId: string;
    variationId: string;
    userId?: string;
    sessionId?: string;
    timestamp: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
//# sourceMappingURL=UserVariation.d.ts.map