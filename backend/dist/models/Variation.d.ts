import { Model, Optional } from "sequelize";
export interface VariationAttributes {
    id: string;
    experimentId: string;
    name: string;
    weight: number;
    isBaseline: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface VariationCreationAttributes extends Optional<VariationAttributes, "id" | "createdAt" | "updatedAt"> {
}
export declare class Variation extends Model<VariationAttributes, VariationCreationAttributes> implements VariationAttributes {
    id: string;
    experimentId: string;
    name: string;
    weight: number;
    isBaseline: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
//# sourceMappingURL=Variation.d.ts.map