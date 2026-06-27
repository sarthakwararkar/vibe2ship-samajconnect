const { db, FieldValue } = require("../config/firebase");
const geminiService = require("../services/gemini.service");
const trustService = require("../services/trust.service");

/**
 * POST /api/marketplace/listings — Create a listing.
 */
async function createListing(req, res, next) {
  try {
    const uid = req.user.uid;
    const {
      title, description, category, listingType = "sell",
      price = 0, condition = "good", photoUrls = [],
      lat, lng, ward, city,
      listingTypeDetails = {}
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required", code: "MISSING_FIELDS" });
    }

    // Get user profile
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found", code: "NOT_REGISTERED" });
    }
    const user = userSnap.data();

    // Check minimum trust score to list (50)
    if ((user.trustScore || 0) < 50) {
      return res.status(403).json({
        error: "Minimum trust score of 50 required to list items. Keep contributing to the community!",
        currentScore: user.trustScore || 0,
        code: "INSUFFICIENT_TRUST"
      });
    }

    // 1. Content moderation
    let moderation = { isAppropriate: true, confidence: 1.0, reason: null };
    try {
      moderation = await geminiService.moderateContent(title + " " + description, "listing");
    } catch (err) {
      console.warn("Listing moderation failed:", err.message);
    }

    if (!moderation.isAppropriate) {
      return res.status(400).json({
        error: "Content flagged as inappropriate",
        reason: moderation.reason,
        code: "CONTENT_FLAGGED"
      });
    }

    // 2. AI price suggestion
    let aiPrice = { minPrice: 0, maxPrice: 0, suggestedPrice: 0, reasoning: "", currency: "INR" };
    if (listingType === "sell") {
      try {
        aiPrice = await geminiService.suggestItemPrice(title, condition, category, description);
      } catch (err) {
        console.warn("AI price suggestion failed:", err.message);
      }
    }

    // 3. AI condition assessment
    let aiCondition = { condition: condition, confidence: 0.5, notes: "", repairSuggestion: null };
    try {
      aiCondition = await geminiService.assessItemCondition(description);
    } catch (err) {
      console.warn("AI condition assessment failed:", err.message);
    }

    // 4. Create listing
    const listingRef = db.collection("listings").doc();
    await listingRef.set({
      sellerId: uid,
      sellerName: user.name,
      sellerTier: user.tier,
      sellerTrustScore: user.trustScore || 0,
      title,
      description,
      category: category || "other",
      listingType,
      price: listingType === "donate" ? 0 : (price || 0),
      aiSuggestedPriceMin: aiPrice.minPrice || 0,
      aiSuggestedPriceMax: aiPrice.maxPrice || 0,
      condition: condition || "good",
      aiCondition: aiCondition.condition,
      aiConditionNotes: aiCondition.notes || "",
      photoUrls: photoUrls || [],
      lat: lat || user.lat || null,
      lng: lng || user.lng || null,
      ward: ward || user.ward || "",
      city: city || user.city || "Latur",
      status: "active",
      listingTypeDetails: {
        borrowDurationDays: listingTypeDetails.borrowDurationDays || null,
        depositAmount: listingTypeDetails.depositAmount || null,
        donationPreference: listingTypeDetails.donationPreference || null
      },
      claimedBy: null,
      viewCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // 5. Award trust points
    const eventKey = listingType === "donate" ? "item_donated" : "item_listed";
    const points = listingType === "donate" ? 30 : 5;
    await trustService.addPoints(uid, eventKey, listingRef.id, "listing");

    res.status(201).json({
      id: listingRef.id,
      aiSuggestedPrice: aiPrice,
      aiCondition,
      message: "Listing created successfully",
      pointsAwarded: points
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketplace/listings — Browse listings with filters.
 */
async function listListings(req, res, next) {
  try {
    const {
      city, ward, category, listingType, status = "active",
      condition, sortBy = "createdAt", order = "desc",
      limit = 20
    } = req.query;

    let query = db.collection("listings");

    if (city) query = query.where("city", "==", city);
    if (ward) query = query.where("ward", "==", ward);
    if (category) query = query.where("category", "==", category);
    if (listingType) query = query.where("listingType", "==", listingType);
    if (status) query = query.where("status", "==", status);

    query = query.orderBy(sortBy, order).limit(parseInt(limit));

    const snap = await query.get();
    const listings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ listings, count: listings.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketplace/listings/:id — Get single listing.
 */
async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    const listingSnap = await db.collection("listings").doc(id).get();

    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found", code: "LISTING_NOT_FOUND" });
    }

    // Increment view count
    await db.collection("listings").doc(id).update({
      viewCount: FieldValue.increment(1)
    });

    res.json({ id: listingSnap.id, ...listingSnap.data() });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/marketplace/listings/:id — Update listing.
 */
async function updateListing(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const listingSnap = await db.collection("listings").doc(id).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found", code: "LISTING_NOT_FOUND" });
    }

    if (listingSnap.data().sellerId !== uid) {
      return res.status(403).json({ error: "Only the seller can update this listing", code: "UNAUTHORIZED" });
    }

    const allowedFields = ["title", "description", "price", "condition", "photoUrls", "status", "listingTypeDetails"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    updates.updatedAt = FieldValue.serverTimestamp();

    await db.collection("listings").doc(id).update(updates);

    res.json({ id, message: "Listing updated", ...updates });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/marketplace/listings/:id — Delete/deactivate listing.
 */
async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const listingSnap = await db.collection("listings").doc(id).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found", code: "LISTING_NOT_FOUND" });
    }

    if (listingSnap.data().sellerId !== uid) {
      return res.status(403).json({ error: "Only the seller can delete this listing", code: "UNAUTHORIZED" });
    }

    // Soft delete — set to expired
    await db.collection("listings").doc(id).update({
      status: "expired",
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ id, message: "Listing removed" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marketplace/listings/:id/claim — Claim a donation.
 */
async function claimListing(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const listingSnap = await db.collection("listings").doc(id).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found", code: "LISTING_NOT_FOUND" });
    }

    const listing = listingSnap.data();
    if (listing.status !== "active") {
      return res.status(400).json({ error: "Listing is no longer active", code: "NOT_ACTIVE" });
    }

    if (listing.listingType !== "donate") {
      return res.status(400).json({ error: "Only donations can be claimed", code: "NOT_DONATION" });
    }

    await db.collection("listings").doc(id).update({
      status: "claimed",
      claimedBy: uid,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Notify seller
    await trustService.addNotification(
      listing.sellerId, "item_claimed",
      "Item Claimed! 🎁",
      `Your donated item "${listing.title}" has been claimed.`,
      id
    );

    res.json({ message: "Item claimed successfully", listingId: id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marketplace/listings/:id/borrow — Request to borrow.
 */
async function borrowListing(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const listingSnap = await db.collection("listings").doc(id).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found", code: "LISTING_NOT_FOUND" });
    }

    const listing = listingSnap.data();
    if (listing.status !== "active") {
      return res.status(400).json({ error: "Listing is no longer active", code: "NOT_ACTIVE" });
    }

    if (listing.listingType !== "borrow") {
      return res.status(400).json({ error: "This item is not available for borrowing", code: "NOT_BORROW" });
    }

    await db.collection("listings").doc(id).update({
      status: "borrowed",
      claimedBy: uid,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Notify seller
    await trustService.addNotification(
      listing.sellerId, "item_borrowed",
      "Borrow Request! 📦",
      `Someone wants to borrow your item "${listing.title}".`,
      id
    );

    res.json({ message: "Borrow request submitted", listingId: id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marketplace/listings/:id/sold — Mark as sold/completed.
 */
async function markSold(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const listingSnap = await db.collection("listings").doc(id).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found", code: "LISTING_NOT_FOUND" });
    }

    const listing = listingSnap.data();
    if (listing.sellerId !== uid) {
      return res.status(403).json({ error: "Only the seller can mark as sold", code: "UNAUTHORIZED" });
    }

    // Determine final status based on listing type
    let finalStatus = "sold";
    if (listing.listingType === "donate") finalStatus = "claimed";
    if (listing.listingType === "borrow") finalStatus = "borrowed";

    await db.collection("listings").doc(id).update({
      status: finalStatus,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award trust points
    if (listing.listingType === "donate") {
      await trustService.addPoints(uid, "item_donated", id, "listing");
    } else {
      await trustService.addPoints(uid, "item_transacted", id, "listing");
    }

    const points = listing.listingType === "donate" ? 30 : 15;

    res.json({
      id,
      status: finalStatus,
      message: "Transaction completed",
      pointsAwarded: points
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketplace/ai-price — AI price suggestion.
 */
async function getAiPrice(req, res, next) {
  try {
    const { item, condition = "good", category = "other", description = "" } = req.query;

    if (!item) {
      return res.status(400).json({ error: "item parameter is required", code: "MISSING_ITEM" });
    }

    const priceSuggestion = await geminiService.suggestItemPrice(item, condition, category, description);

    res.json({ item, condition, category, priceSuggestion });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketplace/needs — Browse need posts.
 */
async function listNeeds(req, res, next) {
  try {
    const { city, ward, category, status = "open", limit = 20 } = req.query;

    let query = db.collection("needs");

    if (city) query = query.where("city", "==", city);
    if (ward) query = query.where("ward", "==", ward);
    if (category) query = query.where("category", "==", category);
    if (status) query = query.where("status", "==", status);

    query = query.orderBy("createdAt", "desc").limit(parseInt(limit));

    const snap = await query.get();
    const needs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ needs, count: needs.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marketplace/needs — Post a need.
 */
async function createNeed(req, res, next) {
  try {
    const uid = req.user.uid;
    const { title, category, needType = "buy", ward, city } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required", code: "MISSING_TITLE" });
    }

    const userSnap = await db.collection("users").doc(uid).get();
    const userName = userSnap.data()?.name || "User";

    const needRef = db.collection("needs").doc();
    await needRef.set({
      userId: uid,
      userName,
      title,
      category: category || "other",
      needType,
      ward: ward || "",
      city: city || "Latur",
      status: "open",
      responseCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    res.status(201).json({
      id: needRef.id,
      message: "Need posted successfully"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/marketplace/needs/:id/fulfill — Mark need as fulfilled.
 */
async function fulfillNeed(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const needSnap = await db.collection("needs").doc(id).get();
    if (!needSnap.exists) {
      return res.status(404).json({ error: "Need not found", code: "NEED_NOT_FOUND" });
    }

    if (needSnap.data().userId !== uid) {
      return res.status(403).json({ error: "Only the poster can mark as fulfilled", code: "UNAUTHORIZED" });
    }

    await db.collection("needs").doc(id).update({
      status: "fulfilled",
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ id, message: "Need marked as fulfilled", status: "fulfilled" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createListing,
  listListings,
  getListing,
  updateListing,
  deleteListing,
  claimListing,
  borrowListing,
  markSold,
  getAiPrice,
  listNeeds,
  createNeed,
  fulfillNeed
};
