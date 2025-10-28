import { Request, Response } from "express";
import { Experiment, Variation, UserVariation, SuccessEvent } from "../models";
import { Op } from "sequelize";

export const createExperiment = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      version,
      startDate,
      endDate,
      variations,
      successMetric,
    } = req.body;

    // Validate variations weights sum to 100%
    if (variations && variations.length > 0) {
      const totalWeight = variations.reduce((sum: number, variation: any) => {
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

    const experiment = await Experiment.create({
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
      await Promise.all(
        variations.map((variation: any) =>
          Variation.create({
            experimentId: experiment.id,
            name: variation.name,
            weight: variation.weight || 1.0,
            isBaseline: variation.isBaseline || false,
          })
        )
      );
    }

    const experimentWithVariations = await Experiment.findByPk(experiment.id, {
      include: [{ model: Variation, as: "variations" }],
    });

    res.status(201).json(experimentWithVariations);
  } catch (error) {
    console.error("Error creating experiment:", error);
    res.status(500).json({ error: "Failed to create experiment" });
  }
};

export const getExperiments = async (req: Request, res: Response) => {
  try {
    const experiments = await Experiment.findAll({
      include: [{ model: Variation, as: "variations" }],
      order: [["createdAt", "DESC"]],
    });

    // Calculate isActive based on current date and endDate
    const now = new Date();
    const experimentsWithCalculatedActive = experiments.map(
      (experiment: any) => {
        let isActive = experiment.isActive;

        // If experiment has an endDate and it's in the past, it should be inactive
        if (experiment.endDate && new Date(experiment.endDate) < now) {
          isActive = false;
        }

        return {
          ...experiment.toJSON(),
          isActive,
        };
      }
    );

    res.json(experimentsWithCalculatedActive);
  } catch (error) {
    console.error("Error fetching experiments:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({ error: "Failed to fetch experiments" });
  }
};

export const getExperiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const experiment = await Experiment.findByPk(id, {
      include: [{ model: Variation, as: "variations" }],
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
  } catch (error) {
    console.error("Error fetching experiment:", error);
    res.status(500).json({ error: "Failed to fetch experiment" });
  }
};

export const updateExperiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      version,
      startDate,
      endDate,
      isActive,
      variations,
      successMetric,
    } = req.body;

    const experiment = await Experiment.findByPk(id);
    if (!experiment) {
      return res.status(404).json({ error: "Experiment not found" });
    }

    // Validate variations weights if provided
    if (variations && variations.length > 0) {
      const totalWeight = variations.reduce((sum: number, variation: any) => {
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

    // Update experiment basic fields
    await experiment.update({
      name,
      description,
      version,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive,
      successMetric: successMetric || null,
    });

    // Update variations if provided
    if (variations && variations.length > 0) {
      // Get existing variations
      const existingVariations = await Variation.findAll({
        where: { experimentId: id },
      });

      // Update existing variations or create new ones
      for (const variationData of variations) {
        const existingVariation = existingVariations.find(
          (v) => v.name === variationData.name
        );

        if (existingVariation) {
          // Update existing variation
          await existingVariation.update({
            weight: variationData.weight || 1.0,
            isBaseline: variationData.isBaseline || false,
          });
        } else {
          // Create new variation if it doesn't exist
          await Variation.create({
            experimentId: id,
            name: variationData.name,
            weight: variationData.weight || 1.0,
            isBaseline: variationData.isBaseline || false,
          });
        }
      }

      // Remove variations that are no longer in the request
      const requestedNames = variations.map((v: any) => v.name);
      await Variation.destroy({
        where: {
          experimentId: id,
          name: { [Op.notIn]: requestedNames },
        },
      });
    }

    const updatedExperiment = await Experiment.findByPk(id, {
      include: [{ model: Variation, as: "variations" }],
    });

    res.json(updatedExperiment);
  } catch (error) {
    console.error("Error updating experiment:", error);
    res.status(500).json({ error: "Failed to update experiment" });
  }
};

export const deleteExperiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const experiment = await Experiment.findByPk(id);

    if (!experiment) {
      return res.status(404).json({ error: "Experiment not found" });
    }

    await experiment.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting experiment:", error);
    res.status(500).json({ error: "Failed to delete experiment" });
  }
};

export const getExperimentVariation = async (req: Request, res: Response) => {
  try {
    const { id: experimentId } = req.params;
    const { userId, sessionId } = req.query;

    // Find existing user variation
    const whereClause: any = { experimentId };
    if (userId) whereClause.userId = userId as string;
    if (sessionId) whereClause.sessionId = sessionId as string;

    const userVariation = await UserVariation.findOne({
      where: whereClause,
    });

    if (userVariation) {
      // Fetch the variation details separately
      const variation = await Variation.findByPk(userVariation.variationId);

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
  } catch (error) {
    console.error("Error fetching experiment variation:", error);
    res.status(500).json({ error: "Failed to fetch experiment variation" });
  }
};

export const persistExperimentVariation = async (
  req: Request,
  res: Response
) => {
  try {
    const { experimentId, variation } = req.body;
    const { userId, sessionId } = req.query;

    // Find the variation by name
    const variationRecord = await Variation.findOne({
      where: {
        experimentId,
        name: variation,
      },
    });

    if (!variationRecord) {
      return res.status(404).json({ error: "Variation not found" });
    }

    // Check if user already has a variation for this experiment
    const whereClause: any = { experimentId };
    if (userId) whereClause.userId = userId as string;
    if (sessionId) whereClause.sessionId = sessionId as string;

    const existingVariation = await UserVariation.findOne({
      where: whereClause,
    });

    if (existingVariation) {
      return res.json({ message: "Variation already exists for this user" });
    }

    // Create new user variation
    const userVariation = await UserVariation.create({
      experimentId,
      variationId: variationRecord.id,
      userId: userId as string,
      sessionId: sessionId as string,
      timestamp: new Date(),
    });

    res.status(201).json(userVariation);
  } catch (error) {
    console.error("Error persisting experiment variation:", error);
    res.status(500).json({ error: "Failed to persist experiment variation" });
  }
};

export const getExperimentStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experiment = await Experiment.findByPk(id, {
      include: [
        {
          model: Variation,
          as: "variations",
          include: [
            {
              model: UserVariation,
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
    const successEvents = await SuccessEvent.findAll({
      where: {
        experimentId: id,
      },
    });

    const variations = (experiment as any).variations || [];
    const stats = await Promise.all(
      variations.map(async (variation: any) => {
        const userIds =
          variation.userVariations?.map((uv: any) => uv.userId) || [];
        const successCount = successEvents.filter((se) =>
          userIds.includes(se.userId)
        ).length;

        const uniqueSuccessUsers = new Set(
          successEvents
            .filter((se) => userIds.includes(se.userId))
            .map((se) => se.userId)
        ).size;

        const userCount = variation.userVariations?.length || 0;
        const successRate =
          userCount > 0 ? (uniqueSuccessUsers / userCount) * 100 : 0;

        return {
          id: variation.id,
          name: variation.name,
          weight: variation.weight,
          isBaseline: variation.isBaseline,
          userCount: userCount,
          successCount: uniqueSuccessUsers,
          successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
          percentage:
            variations.reduce(
              (total: number, v: any) =>
                total + (v.userVariations?.length || 0),
              0
            ) > 0
              ? (userCount /
                  variations.reduce(
                    (total: number, v: any) =>
                      total + (v.userVariations?.length || 0),
                    0
                  )) *
                100
              : 0,
        };
      })
    );

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
      totalUsers: variations.reduce(
        (total: number, v: any) => total + (v.userVariations?.length || 0),
        0
      ),
      totalSuccessEvents: successEvents.length,
    });
  } catch (error) {
    console.error("Error fetching experiment stats:", error);
    res.status(500).json({ error: "Failed to fetch experiment stats" });
  }
};

export const trackSuccess = async (req: Request, res: Response) => {
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
    const experiment = await Experiment.findByPk(id);
    if (!experiment) {
      return res.status(404).json({ error: "Experiment not found" });
    }

    // Check if user has a variation for this experiment
    const userVariation = await UserVariation.findOne({
      where: {
        experimentId: id,
        userId: userId,
      } as any,
    });

    if (!userVariation) {
      return res.status(400).json({
        error:
          "User not found in experiment. User must be assigned to a variation first.",
      });
    }

    // Create success event
    const successEvent = await SuccessEvent.create({
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
  } catch (error) {
    console.error("Error tracking success event:", error);
    res.status(500).json({ error: "Failed to track success event" });
  }
};
