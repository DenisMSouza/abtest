import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

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

export interface UserVariationCreationAttributes
  extends Optional<UserVariationAttributes, "id" | "createdAt" | "updatedAt"> {}

export class UserVariation
  extends Model<UserVariationAttributes, UserVariationCreationAttributes>
  implements UserVariationAttributes
{
  public id!: string;
  public experimentId!: string;
  public variationId!: string;
  public userId?: string;
  public sessionId?: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserVariation.init(
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
    variationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "variations",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: "user_variations",
  }
);
