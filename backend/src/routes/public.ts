import { Router } from "express";
import { validateApiKey } from "../middleware/auth";
import {
  getExperiment,
  trackSuccess,
  getExperimentVariation,
  persistExperimentVariation,
} from "../controllers/experimentController";

const router = Router();

// Test route (protected for security)
router.get("/test", validateApiKey, (req, res) => {
  res.json({ message: "Test route working" });
});

// ===== PUBLIC API (for developers using the SDK) =====
// These endpoints are exposed to external developers and documented

/**
 * @route GET /api/experiments/:id/variation
 * @desc Get experiment variation for user (SDK endpoint)
 * @access Public
 */
router.get(
  "/experiments/:id/variation",
  validateApiKey,
  getExperimentVariation
);

/**
 * @route POST /api/experiments/:id/variation
 * @desc Persist experiment variation for user (SDK endpoint)
 * @access Public
 */
router.post(
  "/experiments/:id/variation",
  validateApiKey,
  persistExperimentVariation
);

/**
 * @route POST /api/experiments/:id/success
 * @desc Track success events (public endpoint for SDK)
 * @access Public
 */
router.post("/experiments/:id/success", validateApiKey, trackSuccess);

/**
 * @route GET /api/experiments/:id
 * @desc Get experiment details (public endpoint for SDK)
 * @access Public
 */
router.get("/experiments/:id", validateApiKey, getExperiment);

export default router;
