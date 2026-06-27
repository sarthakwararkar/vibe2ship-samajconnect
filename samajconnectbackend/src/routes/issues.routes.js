const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");
const issuesController = require("../controllers/issues.controller");

// Public routes
router.get("/", issuesController.listIssues);
router.get("/nearby", issuesController.getNearbyIssues);
router.get("/stats", issuesController.getIssueStats);
router.get("/:id", issuesController.getIssue);

// Protected routes
router.post("/", authMiddleware, aiLimiter, issuesController.createIssue);
router.patch("/:id/upvote", authMiddleware, issuesController.upvoteIssue);
router.patch("/:id/status", authMiddleware, issuesController.updateIssueStatus);
router.post("/:id/resolve", authMiddleware, issuesController.resolveIssue);

module.exports = router;
