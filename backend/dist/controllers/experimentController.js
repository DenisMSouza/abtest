"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackSuccess = exports.getExperimentStats = exports.persistExperimentVariation = exports.getExperimentVariation = exports.deleteExperiment = exports.updateExperiment = exports.getExperiment = exports.getExperiments = exports.createExperiment = void 0;
const models_1 = require("../models");
const createExperiment = async (req, res) => {
    try {
        const { name, description, version, startDate, endDate, variations, successMetric, } = req.body;
        // Validate variations weights sum to 100%
        if (variations && variations.length > 0) {
            const totalWeight = variations.reduce((sum, variation) => {
                return sum + (variation.weight || 0);
            }, 0);
            // Allow for small floating point precision errors (0.01%)
            if (Math.abs(totalWeight - 1.0) > 0.0001) {
                return res.status(400).json({
                    error: "Variation weights must sum to 100% (1.0)",
                    totalWeight: totalWeight,
                    expectedWeight: 1.0,
                });
            }
        }
        const experiment = await models_1.Experiment.create({
            name,
            description,
            version,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            isActive: true,
            successMetric: successMetric || null,
        });
        // Create variations
        if (variations && variations.length > 0) {
            await Promise.all(variations.map((variation) => models_1.Variation.create({
                experimentId: experiment.id,
                name: variation.name,
                weight: variation.weight || 1.0,
                isBaseline: variation.isBaseline || false,
            })));
        }
        const experimentWithVariations = await models_1.Experiment.findByPk(experiment.id, {
            include: [{ model: models_1.Variation, as: "variations" }],
        });
        res.status(201).json(experimentWithVariations);
    }
    catch (error) {
        console.error("Error creating experiment:", error);
        res.status(500).json({ error: "Failed to create experiment" });
    }
};
exports.createExperiment = createExperiment;
const getExperiments = async (req, res) => {
    try {
        console.log("Starting getExperiments...");
        const experiments = await models_1.Experiment.findAll({
            include: [{ model: models_1.Variation, as: "variations" }],
            order: [["createdAt", "DESC"]],
        });
        // Calculate isActive based on current date and endDate
        const now = new Date();
        const experimentsWithCalculatedActive = experiments.map((experiment) => {
            let isActive = experiment.isActive;
            // If experiment has an endDate and it's in the past, it should be inactive
            if (experiment.endDate && new Date(experiment.endDate) < now) {
                isActive = false;
            }
            return {
                ...experiment.toJSON(),
                isActive,
            };
        });
        console.log("Found experiments:", experimentsWithCalculatedActive.length);
        res.json(experimentsWithCalculatedActive);
    }
    catch (error) {
        console.error("Error fetching experiments:", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Error stack:", error.stack);
        }
        res.status(500).json({ error: "Failed to fetch experiments" });
    }
};
exports.getExperiments = getExperiments;
const getExperiment = async (req, res) => {
    try {
        const { id } = req.params;
        const experiment = await models_1.Experiment.findByPk(id, {
            include: [{ model: models_1.Variation, as: "variations" }],
        });
        if (!experiment) {
            return res.status(404).json({ error: "Experiment not found" });
        }
        // Calculate isActive based on current date and endDate
        const now = new Date();
        let isActive = experiment.isActive;
        // If experiment has an endDate and it's in the past, it should be inactive
        if (experiment.endDate && new Date(experiment.endDate) < now) {
            isActive = false;
        }
        const experimentWithCalculatedActive = {
            ...experiment.toJSON(),
            isActive,
        };
        res.json(experimentWithCalculatedActive);
    }
    catch (error) {
        console.error("Error fetching experiment:", error);
        res.status(500).json({ error: "Failed to fetch experiment" });
    }
};
exports.getExperiment = getExperiment;
const updateExperiment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, version, startDate, endDate, isActive } = req.body;
        const experiment = await models_1.Experiment.findByPk(id);
        if (!experiment) {
            return res.status(404).json({ error: "Experiment not found" });
        }
        await experiment.update({
            name,
            description,
            version,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            isActive,
        });
        const updatedExperiment = await models_1.Experiment.findByPk(id, {
            include: [{ model: models_1.Variation, as: "variations" }],
        });
        res.json(updatedExperiment);
    }
    catch (error) {
        console.error("Error updating experiment:", error);
        res.status(500).json({ error: "Failed to update experiment" });
    }
};
exports.updateExperiment = updateExperiment;
const deleteExperiment = async (req, res) => {
    try {
        const { id } = req.params;
        const experiment = await models_1.Experiment.findByPk(id);
        if (!experiment) {
            return res.status(404).json({ error: "Experiment not found" });
        }
        await experiment.destroy();
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting experiment:", error);
        res.status(500).json({ error: "Failed to delete experiment" });
    }
};
exports.deleteExperiment = deleteExperiment;
const getExperimentVariation = async (req, res) => {
    try {
        const { id: experimentId } = req.params;
        const { userId, sessionId } = req.query;
        // Find existing user variation
        const whereClause = { experimentId };
        if (userId)
            whereClause.userId = userId;
        if (sessionId)
            whereClause.sessionId = sessionId;
        const userVariation = await models_1.UserVariation.findOne({
            where: whereClause,
        });
        if (userVariation) {
            // Fetch the variation details separately
            const variation = await models_1.Variation.findByPk(userVariation.variationId);
            if (variation) {
                return res.json([
                    {
                        experiment: experimentId,
                        variation: variation.name,
                        timestamp: userVariation.timestamp,
                    },
                ]);
            }
        }
        res.json([]);
    }
    catch (error) {
        console.error("Error fetching experiment variation:", error);
        res.status(500).json({ error: "Failed to fetch experiment variation" });
    }
};
exports.getExperimentVariation = getExperimentVariation;
const persistExperimentVariation = async (req, res) => {
    try {
        const { experimentId, variation } = req.body;
        const { userId, sessionId } = req.query;
        // Find the variation by name
        const variationRecord = await models_1.Variation.findOne({
            where: {
                experimentId,
                name: variation,
            },
        });
        if (!variationRecord) {
            return res.status(404).json({ error: "Variation not found" });
        }
        // Check if user already has a variation for this experiment
        const whereClause = { experimentId };
        if (userId)
            whereClause.userId = userId;
        if (sessionId)
            whereClause.sessionId = sessionId;
        const existingVariation = await models_1.UserVariation.findOne({
            where: whereClause,
        });
        if (existingVariation) {
            return res.json({ message: "Variation already exists for this user" });
        }
        // Create new user variation
        const userVariation = await models_1.UserVariation.create({
            experimentId,
            variationId: variationRecord.id,
            userId: userId,
            sessionId: sessionId,
            timestamp: new Date(),
        });
        res.status(201).json(userVariation);
    }
    catch (error) {
        console.error("Error persisting experiment variation:", error);
        res.status(500).json({ error: "Failed to persist experiment variation" });
    }
};
exports.persistExperimentVariation = persistExperimentVariation;
const getExperimentStats = async (req, res) => {
    try {
        const { id } = req.params;
        const experiment = await models_1.Experiment.findByPk(id, {
            include: [
                {
                    model: models_1.Variation,
                    as: "variations",
                    include: [
                        {
                            model: models_1.UserVariation,
                            as: "userVariations",
                        },
                    ],
                },
            ],
        });
        if (!experiment) {
            return res.status(404).json({ error: "Experiment not found" });
        }
        // Get all success events for this experiment
        const successEvents = await models_1.SuccessEvent.findAll({
            where: {
                experimentId: id,
            },
        });
        const variations = experiment.variations || [];
        const stats = await Promise.all(variations.map(async (variation) => {
            const userIds = variation.userVariations?.map((uv) => uv.userId) || [];
            const successCount = successEvents.filter((se) => userIds.includes(se.userId)).length;
            const uniqueSuccessUsers = new Set(successEvents
                .filter((se) => userIds.includes(se.userId))
                .map((se) => se.userId)).size;
            const userCount = variation.userVariations?.length || 0;
            const successRate = userCount > 0 ? (uniqueSuccessUsers / userCount) * 100 : 0;
            return {
                id: variation.id,
                name: variation.name,
                weight: variation.weight,
                isBaseline: variation.isBaseline,
                userCount: userCount,
                successCount: uniqueSuccessUsers,
                successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
                percentage: variations.reduce((total, v) => total + (v.userVariations?.length || 0), 0) > 0
                    ? (userCount /
                        variations.reduce((total, v) => total + (v.userVariations?.length || 0), 0)) *
                        100
                    : 0,
            };
        }));
        // Calculate isActive based on current date and endDate
        const now = new Date();
        let isActive = experiment.isActive;
        // If experiment has an endDate and it's in the past, it should be inactive
        if (experiment.endDate && new Date(experiment.endDate) < now) {
            isActive = false;
        }
        res.json({
            experiment: {
                id: experiment.id,
                name: experiment.name,
                description: experiment.description,
                isActive: isActive,
                successMetric: experiment.successMetric,
            },
            variations: stats,
            totalUsers: variations.reduce((total, v) => total + (v.userVariations?.length || 0), 0),
            totalSuccessEvents: successEvents.length,
        });
    }
    catch (error) {
        console.error("Error fetching experiment stats:", error);
        res.status(500).json({ error: "Failed to fetch experiment stats" });
    }
};
exports.getExperimentStats = getExperimentStats;
const trackSuccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, event, value } = req.body;
        // Validate required fields
        if (!userId || !event) {
            return res.status(400).json({
                error: "userId and event are required",
            });
        }
        // Check if experiment exists
        const experiment = await models_1.Experiment.findByPk(id);
        if (!experiment) {
            return res.status(404).json({ error: "Experiment not found" });
        }
        // Check if user has a variation for this experiment
        const userVariation = await models_1.UserVariation.findOne({
            where: {
                experimentId: id,
                userId: userId,
            },
        });
        if (!userVariation) {
            return res.status(400).json({
                error: "User not found in experiment. User must be assigned to a variation first.",
            });
        }
        // Create success event
        const successEvent = await models_1.SuccessEvent.create({
            experimentId: id,
            userId: userId,
            event: event,
            value: value || null,
            timestamp: new Date(),
        });
        res.status(201).json({
            message: "Success event tracked",
            successEvent: {
                id: successEvent.id,
                experimentId: successEvent.experimentId,
                userId: successEvent.userId,
                event: successEvent.event,
                value: successEvent.value,
                timestamp: successEvent.timestamp,
            },
        });
    }
    catch (error) {
        console.error("Error tracking success event:", error);
        res.status(500).json({ error: "Failed to track success event" });
    }
};
exports.trackSuccess = trackSuccess;
//# sourceMappingURL=experimentController.js.map