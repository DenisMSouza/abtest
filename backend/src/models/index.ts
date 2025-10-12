import { Experiment } from "./Experiment";
import { Variation } from "./Variation";
import { UserVariation } from "./UserVariation";

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

export { Experiment, Variation, UserVariation };
