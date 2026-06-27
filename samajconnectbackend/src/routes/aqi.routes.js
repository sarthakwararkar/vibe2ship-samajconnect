const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");
const aqiController = require("../controllers/aqi.controller");

// Public routes
router.get("/current", aqiController.getCurrentAqi);
router.get("/forecast", aqiController.getAqiForecast);
router.get("/doctors", aqiController.getDoctors);
router.get("/history", aqiController.getAqiHistory);
router.get("/alert-zones", aqiController.getAlertZones);

// Protected routes
router.post("/health-advice", authMiddleware, aiLimiter, aqiController.getHealthAdvice);
router.patch("/doctors/:id/surge", authMiddleware, aqiController.toggleDoctorSurge);
router.post("/sensor-reading", authMiddleware, aqiController.submitSensorReading);

module.exports = router;
