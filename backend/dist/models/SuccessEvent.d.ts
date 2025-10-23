import { Model, Optional } from "sequelize";
export interface SuccessEventAttributes {
    id: string;
    experimentId: string;
    userId: string;
    event: string;
    value?: number;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface SuccessEventCreationAttributes extends Optional<SuccessEventAttributes, "id" | "createdAt" | "updatedAt"> {
}
export declare class SuccessEvent extends Model<SuccessEventAttributes, SuccessEventCreationAttributes> implements SuccessEventAttributes {
    id: string;
    experimentId: string;
    userId: string;
    event: string;
    value?: number;
    timestamp: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
//# sourceMappingURL=SuccessEvent.d.ts.map