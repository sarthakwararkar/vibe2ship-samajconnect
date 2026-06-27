const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const trustController = require("../controllers/trust.controller");

// Public routes
router.get("/score/:uid", trustController.getTrustScore);
router.get("/leaderboard", trustController.getLeaderboard);
router.get("/badges/:uid", trustController.getBadges);
router.get("/tiers", trustController.getTiers);

// Protected routes (own history only)
router.get("/history/:uid", authMiddleware, trustController.getTrustHistory);

module.exports = router;
