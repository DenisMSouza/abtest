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
  trackSuccess,
} from "../controllers/experimentController";

const router = Router();

// ===== PUBLIC API (for developers using the SDK) =====
// These endpoints are exposed to external developers
router.get("/:id", getExperiment); // Get experiment details
router.post("/:id/success", trackSuccess); // Track success events

// ===== INTERNAL API (for dashboard and admin) =====
// These endpoints are for internal use only
router.post("/", createExperiment);
router.get("/", getExperiments);
router.put("/:id", updateExperiment);
router.delete("/:id", deleteExperiment);
router.get("/:id/stats", getExperimentStats);

// ===== SDK INTERNAL API (for the useExperiment hook) =====
// These endpoints are used internally by the SDK
router.get("/:experimentId/variation", getExperimentVariation);
router.post("/:experimentId/variation", persistExperimentVariation);

export default router;
