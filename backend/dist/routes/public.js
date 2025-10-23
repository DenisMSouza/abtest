"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const experimentController_1 = require("../controllers/experimentController");
const router = (0, express_1.Router)();
// Test route (protected for security)
router.get("/test", auth_1.validateApiKey, (req, res) => {
    res.json({ message: "Test route working" });
});
// ===== PUBLIC API (for developers using the SDK) =====
// These endpoints are exposed to external developers and documented
/**
 * @route GET /api/experiments/:id/variation
 * @desc Get experiment variation for user (SDK endpoint)
 * @access Public
 */
router.get("/experiments/:id/variation", auth_1.validateApiKey, experimentController_1.getExperimentVariation);
/**
 * @route POST /api/experiments/:id/variation
 * @desc Persist experiment variation for user (SDK endpoint)
 * @access Public
 */
router.post("/experiments/:id/variation", auth_1.validateApiKey, experimentController_1.persistExperimentVariation);
/**
 * @route POST /api/experiments/:id/success
 * @desc Track success events (public endpoint for SDK)
 * @access Public
 */
router.post("/experiments/:id/success", auth_1.validateApiKey, experimentController_1.trackSuccess);
/**
 * @route GET /api/experiments/:id
 * @desc Get experiment details (public endpoint for SDK)
 * @access Public
 */
router.get("/experiments/:id", auth_1.validateApiKey, experimentController_1.getExperiment);
exports.default = router;
//# sourceMappingURL=public.js.map