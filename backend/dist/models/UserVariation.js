"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserVariation = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class UserVariation extends sequelize_1.Model {
}
exports.UserVariation = UserVariation;
UserVariation.init({
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
    variationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "variations",
            key: "id",
        },
    },
    userId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    sessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
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
    tableName: "user_variations",
});
//# sourceMappingURL=UserVariation.js.map