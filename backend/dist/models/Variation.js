"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Variation = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Variation extends sequelize_1.Model {
}
exports.Variation = Variation;
Variation.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    experimentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "experiments",
            key: "id",
        },
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    weight: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1.0,
    },
    isBaseline: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
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
    tableName: "variations",
});
//# sourceMappingURL=Variation.js.map