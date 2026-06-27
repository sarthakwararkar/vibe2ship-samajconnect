const router = require("express").Router();
const { aiLimiter } = require("../middleware/rateLimiter");
const dashboardController = require("../controllers/dashboard.controller");

// All dashboard routes are public
router.get("/stats", dashboardController.getStats);
router.get("/issues-chart", dashboardController.getIssuesChart);
router.get("/aqi-history", dashboardController.getAqiHistory);
router.get("/impact", aiLimiter, dashboardController.getImpact);
router.get("/top-contributors", dashboardController.getTopContributors);

module.exports = router;
