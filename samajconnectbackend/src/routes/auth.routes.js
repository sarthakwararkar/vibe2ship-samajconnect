const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const authController = require("../controllers/auth.controller");

// Public routes
router.get("/profile/:uid", authController.getProfile);

// Protected routes (require authentication)
router.post("/register", authMiddleware, authController.register);
router.post("/profile", authMiddleware, authController.updateProfile);
router.get("/me", authMiddleware, authController.getMe);
router.post("/expert-register", authMiddleware, authController.registerExpert);
router.post("/doctor-register", authMiddleware, authController.registerDoctor);
router.patch("/surge-mode", authMiddleware, authController.toggleSurgeMode);
router.get("/notifications", authMiddleware, authController.getNotifications);
router.patch("/notifications/read-all", authMiddleware, authController.markAllNotificationsRead);

module.exports = router;
