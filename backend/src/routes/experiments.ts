import { Router } from "express";
import { localhostOnly } from "../middleware/localhostOnly";
import {
  createExperiment,
  getExperiments,
  getExperiment,
  updateExperiment,
  deleteExperiment,
  getExperimentStats,
} from "../controllers/experimentController";

const router = Router();

// ===== INTERNAL API (for dashboard and admin) =====
// These endpoints are restricted to localhost only for security
router.post("/", localhostOnly, createExperiment);
router.get("/", localhostOnly, getExperiments);
router.get("/:id", localhostOnly, getExperiment); // Get individual experiment for dashboard
router.put("/:id", localhostOnly, updateExperiment);
router.delete("/:id", localhostOnly, deleteExperiment);
router.get("/:id/stats", localhostOnly, getExperimentStats);

export default router;
