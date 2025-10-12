import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ExperimentAttributes {
  id: string;
  name: string;
  description?: string;
  version?: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
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
