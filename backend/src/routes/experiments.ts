import { Router } from "express";
import {
  createExperiment,
  getExperiments,
  getExperiment,
  updateExperiment,
  deleteExperiment,
  getExperimentVariation,
  persistExperimentVariation,
  getExperimentStats,
} from "../controllers/experimentController";

const router = Router();

// Experiment CRUD routes
router.post("/", createExperiment);
router.get("/", getExperiments);
router.get("/:id", getExperiment);
router.put("/:id", updateExperiment);
router.delete("/:id", deleteExperiment);

// Experiment variation routes
router.get("/:experimentId/variation", getExperimentVariation);
router.post("/:experimentId/variation", persistExperimentVariation);

// Analytics routes
router.get("/:id/stats", getExperimentStats);

export default router;
