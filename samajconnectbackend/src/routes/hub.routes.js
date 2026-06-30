const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");
const hubController = require("../controllers/hub.controller");

// Public routes
router.get("/questions", hubController.listQuestions);
router.get("/questions/search", hubController.searchQuestions);
router.get("/questions/:id", hubController.getQuestion);
router.get("/experts", hubController.listExperts);
router.get("/categories", hubController.getCategories);

// Protected routes
router.post("/questions", authMiddleware, aiLimiter, hubController.createQuestion);
router.post("/ai-category", authMiddleware, aiLimiter, hubController.getAiCategory);
router.post("/questions/:id/answers", authMiddleware, hubController.postAnswer);
router.patch("/questions/:id/answers/:answerId/accept", authMiddleware, hubController.acceptAnswer);
router.patch("/questions/:id/upvote", authMiddleware, hubController.upvoteQuestion);
router.patch("/answers/:answerId/upvote", authMiddleware, hubController.upvoteAnswer);

module.exports = router;
