import { Experiment } from "./Experiment";
import { Variation } from "./Variation";
import { UserVariation } from "./UserVariation";
import { SuccessEvent } from "./SuccessEvent";

// Define associations
Experiment.hasMany(Variation, { foreignKey: "experimentId", as: "variations" });
Variation.belongsTo(Experiment, {
  foreignKey: "experimentId",
  as: "experiment",
});

Experiment.hasMany(UserVariation, {
  foreignKey: "experimentId",
  as: "userVariations",
});
UserVariation.belongsTo(Experiment, {
  foreignKey: "experimentId",
  as: "experiment",
});

Variation.hasMany(UserVariation, {
  foreignKey: "variationId",
  as: "userVariations",
});
UserVariation.belongsTo(Variation, {
  foreignKey: "variationId",
  as: "variation",
});

// SuccessEvent associations
Experiment.hasMany(SuccessEvent, {
  foreignKey: "experimentId",
  as: "successEvents",
});
SuccessEvent.belongsTo(Experiment, {
  foreignKey: "experimentId",
  as: "experiment",
});

export { Experiment, Variation, UserVariation, SuccessEvent };
