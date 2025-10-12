import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface VariationAttributes {
  id: string;
  experimentId: string;
  name: string;
  weight: number;
  isBaseline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariationCreationAttributes
  extends Optional<VariationAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Variation
  extends Model<VariationAttributes, VariationCreationAttributes>
  implements VariationAttributes
{
  public id!: string;
  public experimentId!: string;
  public name!: string;
  public weight!: number;
  public isBaseline!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Variation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    experimentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "experiments",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    isBaseline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: "variations",
  }
);
