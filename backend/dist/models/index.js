"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = exports.SuccessEvent = exports.UserVariation = exports.Variation = exports.Experiment = void 0;
const Experiment_1 = require("./Experiment");
Object.defineProperty(exports, "Experiment", { enumerable: true, get: function () { return Experiment_1.Experiment; } });
const Variation_1 = require("./Variation");
Object.defineProperty(exports, "Variation", { enumerable: true, get: function () { return Variation_1.Variation; } });
const UserVariation_1 = require("./UserVariation");
Object.defineProperty(exports, "UserVariation", { enumerable: true, get: function () { return UserVariation_1.UserVariation; } });
const SuccessEvent_1 = require("./SuccessEvent");
Object.defineProperty(exports, "SuccessEvent", { enumerable: true, get: function () { return SuccessEvent_1.SuccessEvent; } });
const ApiKey_1 = require("./ApiKey");
Object.defineProperty(exports, "ApiKey", { enumerable: true, get: function () { return ApiKey_1.ApiKey; } });
// Define associations
Experiment_1.Experiment.hasMany(Variation_1.Variation, { foreignKey: "experimentId", as: "variations" });
Variation_1.Variation.belongsTo(Experiment_1.Experiment, {
    foreignKey: "experimentId",
    as: "experiment",
});
Experiment_1.Experiment.hasMany(UserVariation_1.UserVariation, {
    foreignKey: "experimentId",
    as: "userVariations",
});
UserVariation_1.UserVariation.belongsTo(Experiment_1.Experiment, {
    foreignKey: "experimentId",
    as: "experiment",
});
Variation_1.Variation.hasMany(UserVariation_1.UserVariation, {
    foreignKey: "variationId",
    as: "userVariations",
});
UserVariation_1.UserVariation.belongsTo(Variation_1.Variation, {
    foreignKey: "variationId",
    as: "variation",
});
// SuccessEvent associations
Experiment_1.Experiment.hasMany(SuccessEvent_1.SuccessEvent, {
    foreignKey: "experimentId",
    as: "successEvents",
});
SuccessEvent_1.SuccessEvent.belongsTo(Experiment_1.Experiment, {
    foreignKey: "experimentId",
    as: "experiment",
});
//# sourceMappingURL=index.js.map