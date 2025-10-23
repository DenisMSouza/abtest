import { Model, Optional } from "sequelize";
export interface SuccessMetric {
    type: "click" | "conversion" | "custom";
    target?: string;
    value?: number;
}
export interface ExperimentAttributes {
    id: string;
    name: string;
    description?: string;
    version?: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    successMetric?: SuccessMetric;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExperimentCreationAttributes extends Optional<ExperimentAttributes, "id" | "createdAt" | "updatedAt"> {
}
export declare class Experiment extends Model<ExperimentAttributes, ExperimentCreationAttributes> implements ExperimentAttributes {
    id: string;
    name: string;
    description?: string;
    version?: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    successMetric?: SuccessMetric;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
//# sourceMappingURL=Experiment.d.ts.map