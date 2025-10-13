import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface SuccessEventAttributes {
  id: string;
  experimentId: string;
  userId: string;
  event: string; // e.g., 'button_click', 'conversion', 'custom_event'
  value?: number; // optional value for custom metrics
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuccessEventCreationAttributes
  extends Optional<SuccessEventAttributes, "id" | "createdAt" | "updatedAt"> {}

export class SuccessEvent
  extends Model<SuccessEventAttributes, SuccessEventCreationAttributes>
  implements SuccessEventAttributes
{
  public id!: string;
  public experimentId!: string;
  public userId!: string;
  public event!: string;
  public value?: number;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SuccessEvent.init(
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
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: "success_events",
    indexes: [
      {
        fields: ["experimentId", "userId"],
      },
      {
        fields: ["experimentId", "event"],
      },
      {
        fields: ["timestamp"],
      },
    ],
  }
);
