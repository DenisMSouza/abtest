import { Router } from "express";
import {
  getExperiment,
  trackSuccess,
} from "../controllers/experimentController";

const router = Router();

// ===== PUBLIC API (for developers using the SDK) =====
// These endpoints are exposed to external developers and documented

/**
 * @route GET /api/experiments/:id
 * @desc Get experiment details (public endpoint for SDK)
 * @access Public
 */
router.get("/experiments/:id", getExperiment);

/**
 * @route POST /api/experiments/:id/success
 * @desc Track success events (public endpoint for SDK)
 * @access Public
 */
router.post("/experiments/:id/success", trackSuccess);

export default router;
