"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const localhostOnly_1 = require("../middleware/localhostOnly");
const experimentController_1 = require("../controllers/experimentController");
const router = (0, express_1.Router)();
// ===== INTERNAL API (for dashboard and admin) =====
// These endpoints are restricted to localhost only for security
router.post("/", localhostOnly_1.localhostOnly, experimentController_1.createExperiment);
router.get("/", localhostOnly_1.localhostOnly, experimentController_1.getExperiments);
router.get("/:id", localhostOnly_1.localhostOnly, experimentController_1.getExperiment); // Get individual experiment for dashboard
router.put("/:id", localhostOnly_1.localhostOnly, experimentController_1.updateExperiment);
router.delete("/:id", localhostOnly_1.localhostOnly, experimentController_1.deleteExperiment);
router.get("/:id/stats", localhostOnly_1.localhostOnly, experimentController_1.getExperimentStats);
exports.default = router;
//# sourceMappingURL=experiments.js.map