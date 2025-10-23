import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

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

export interface ApiKeyCreationAttributes
  extends Optional<ApiKeyAttributes, "id" | "createdAt" | "updatedAt"> {}

export class ApiKey
  extends Model<ApiKeyAttributes, ApiKeyCreationAttributes>
  implements ApiKeyAttributes
{
  public id!: string;
  public key!: string;
  public name!: string;
  public description?: string;
  public isActive!: boolean;
  public lastUsedAt?: Date;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ApiKey.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
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
    modelName: "ApiKey",
    tableName: "api_keys",
    timestamps: true,
  }
);

export default ApiKey;
