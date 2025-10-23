"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Experiment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Experiment extends sequelize_1.Model {
}
exports.Experiment = Experiment;
Experiment.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    version: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    successMetric: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: "experiments",
});
//# sourceMappingURL=Experiment.js.map