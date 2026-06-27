const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");
const safetyController = require("../controllers/safety.controller");

// Public routes
router.get("/risk-zones", safetyController.getRiskZones);
router.get("/disasters/active", safetyController.getActiveDisasters);

// Protected routes
router.get("/circle", authMiddleware, safetyController.getTrustedCircle);
router.post("/circle", authMiddleware, safetyController.addToCircle);
router.delete("/circle/:contactUid", authMiddleware, safetyController.removeFromCircle);
router.post("/journey/start", authMiddleware, aiLimiter, safetyController.startJourney);
router.patch("/journey/:id/checkin", authMiddleware, safetyController.checkInJourney);
router.get("/journey/active", authMiddleware, safetyController.getActiveJourney);
router.get("/journey/history", authMiddleware, safetyController.getJourneyHistory);
router.post("/sos", authMiddleware, safetyController.activateSos);
router.patch("/sos/:id/resolve", authMiddleware, safetyController.resolveSos);
router.post("/incident", authMiddleware, safetyController.reportIncident);
router.post("/route-analysis", authMiddleware, aiLimiter, safetyController.analyzeRoute);
router.post("/disasters", authMiddleware, safetyController.reportDisaster);
router.patch("/disasters/:id/resolve", authMiddleware, safetyController.resolveDisaster);

module.exports = router;
