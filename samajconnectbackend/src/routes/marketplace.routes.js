const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");
const marketplaceController = require("../controllers/marketplace.controller");

// Public routes
router.get("/listings", marketplaceController.listListings);
router.get("/listings/:id", marketplaceController.getListing);
router.get("/ai-price", aiLimiter, marketplaceController.getAiPrice);
router.get("/needs", marketplaceController.listNeeds);

// Protected routes
router.post("/listings", authMiddleware, aiLimiter, marketplaceController.createListing);
router.patch("/listings/:id", authMiddleware, marketplaceController.updateListing);
router.delete("/listings/:id", authMiddleware, marketplaceController.deleteListing);
router.post("/listings/:id/claim", authMiddleware, marketplaceController.claimListing);
router.post("/listings/:id/borrow", authMiddleware, marketplaceController.borrowListing);
router.post("/listings/:id/sold", authMiddleware, marketplaceController.markSold);
router.post("/needs", authMiddleware, marketplaceController.createNeed);
router.patch("/needs/:id/fulfill", authMiddleware, marketplaceController.fulfillNeed);

module.exports = router;
