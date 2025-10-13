import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface SuccessMetric {
  type: "click" | "conversion" | "custom";
  target?: string; // e.g., button ID, URL, custom event name
  value?: number; // for custom metrics
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

export interface ExperimentCreationAttributes
  extends Optional<ExperimentAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Experiment
  extends Model<ExperimentAttributes, ExperimentCreationAttributes>
  implements ExperimentAttributes
{
  public id!: string;
  public name!: string;
  public description?: string;
  public version?: string;
  public startDate?: Date;
  public endDate?: Date;
  public isActive!: boolean;
  public successMetric?: SuccessMetric;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Experiment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    successMetric: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "experiments",
  }
);
