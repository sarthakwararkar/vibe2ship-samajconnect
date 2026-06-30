const { db, FieldValue } = require("../config/firebase");
const geminiService = require("../services/gemini.service");
const trustService = require("../services/trust.service");
const { haversineDistance, getBoundingBox } = require("../services/firestore.service");

/**
 * POST /api/issues — Create a new issue report.
 */
async function createIssue(req, res, next) {
  try {
    const { description, lat, lng, address, ward, city, photoBase64, photoUrl } = req.body;
    const userId = req.user.uid;

    // 1. Get user profile
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found", code: "NOT_REGISTERED" });
    }
    const user = userSnap.data();

    // 2. AI classification (with fallback)
    let aiResult = { category: "other", severity: "medium", department: "municipal", confidence: 0.5, reason: "Manual review" };
    try {
      aiResult = await geminiService.classifyIssue(description, photoBase64 || null);
    } catch (err) {
      console.warn("Gemini classification failed, using defaults:", err.message);
    }

    // 3. Check for duplicates in same area (within same city, recent open/verified/in_progress)
    const recentIssues = await db.collection("issues")
      .where("city", "==", city || "Latur")
      .where("status", "in", ["open", "verified", "in_progress"])
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    const recentIssuesData = recentIssues.docs.map(d => ({ id: d.id, ...d.data() }));

    let duplicateCheck = { isDuplicate: false, similarIssueId: null };
    if (recentIssuesData.length > 0) {
      try {
        duplicateCheck = await geminiService.checkDuplicateIssue(description, lat, lng, recentIssuesData);
      } catch (err) {
        console.warn("Duplicate check failed:", err.message);
      }
    }

    if (duplicateCheck.isDuplicate && duplicateCheck.similarIssueId) {
      return res.status(200).json({
        isDuplicate: true,
        existingIssueId: duplicateCheck.similarIssueId,
        message: "A similar issue already exists. We've upvoted it on your behalf."
      });
    }

    // 4. Create issue in Firestore
    let finalPhotoUrl = photoUrl || null;
    if (photoBase64) {
      try {
        const storageService = require("../services/storage.service");
        finalPhotoUrl = await storageService.uploadBase64(photoBase64, "issues", `issue_${userId}`);
      } catch (err) {
        console.warn("Failed to upload issue photo:", err.message);
      }
    }

    const issueRef = db.collection("issues").doc();
    await issueRef.set({
      reporterId: userId,
      reporterName: user.name,
      reporterTier: user.tier,
      description,
      lat: lat || null,
      lng: lng || null,
      address: address || "",
      ward: ward || "",
      city: city || "Latur",
      photoUrl: finalPhotoUrl,
      videoUrl: null,
      category: aiResult.category,
      severity: aiResult.severity,
      aiCategory: aiResult.category,
      aiSeverity: aiResult.severity,
      aiConfidence: aiResult.confidence,
      aiDepartment: aiResult.department,
      assignedDepartment: aiResult.department,
      status: "open",
      upvotes: 0,
      upvotedBy: [],
      verifiedBy: [],
      verificationCount: 0,
      isDuplicate: false,
      duplicateOf: null,
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // 5. Award Trust Score points
    await trustService.addPoints(userId, "issue_reported", issueRef.id, "issue");

    // 6. Add notification to reporter
    await trustService.addNotification(
      userId, "points_earned",
      "Issue Reported! +50 pts",
      `Your ${aiResult.category} report has been submitted successfully.`,
      issueRef.id
    );

    res.status(201).json({
      id: issueRef.id,
      aiCategory: aiResult.category,
      aiSeverity: aiResult.severity,
      aiDepartment: aiResult.department,
      aiConfidence: aiResult.confidence,
      message: "Issue reported successfully",
      pointsAwarded: 50
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/issues — List issues with filters.
 */
async function listIssues(req, res, next) {
  try {
    const {
      city, ward, category, status,
      sortBy = "createdAt", order = "desc",
      limit = 20, offset = 0
    } = req.query;

    let query = db.collection("issues");

    if (city) query = query.where("city", "==", city);
    if (ward) query = query.where("ward", "==", ward);
    if (category) query = query.where("category", "==", category);
    if (status) query = query.where("status", "==", status);

    query = query.orderBy(sortBy, order).limit(parseInt(limit));

    const snap = await query.get();
    const issues = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ issues, count: issues.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/issues/:id — Get single issue detail.
 */
async function getIssue(req, res, next) {
  try {
    const { id } = req.params;
    const issueSnap = await db.collection("issues").doc(id).get();

    if (!issueSnap.exists) {
      return res.status(404).json({ error: "Issue not found", code: "ISSUE_NOT_FOUND" });
    }

    res.json({ id: issueSnap.id, ...issueSnap.data() });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/issues/:id/upvote — Upvote/verify an issue.
 */
async function upvoteIssue(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const issueSnap = await db.collection("issues").doc(id).get();
    if (!issueSnap.exists) {
      return res.status(404).json({ error: "Issue not found", code: "ISSUE_NOT_FOUND" });
    }

    const issue = issueSnap.data();

    // Check user hasn't already upvoted
    if (issue.upvotedBy && issue.upvotedBy.includes(userId)) {
      return res.status(400).json({ error: "You have already upvoted this issue", code: "ALREADY_UPVOTED" });
    }

    // Update upvotes
    const newUpvotes = (issue.upvotes || 0) + 1;
    const newVerificationCount = (issue.verificationCount || 0) + 1;
    let newStatus = issue.status;

    // Auto-verify if 3+ verifications and status is "open"
    if (newVerificationCount >= 3 && issue.status === "open") {
      newStatus = "verified";
    }

    await db.collection("issues").doc(id).update({
      upvotes: newUpvotes,
      upvotedBy: FieldValue.arrayUnion(userId),
      verifiedBy: FieldValue.arrayUnion(userId),
      verificationCount: newVerificationCount,
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award +10 points to verifier
    await trustService.addPoints(userId, "issue_verified", id, "issue");

    // Notify reporter if status changed to verified
    if (newStatus === "verified" && issue.status !== "verified") {
      await trustService.addNotification(
        issue.reporterId, "issue_resolved",
        "Issue Verified! ✅",
        `Your issue "${issue.description.slice(0, 50)}..." has been verified by the community.`,
        id
      );
    }

    res.json({
      upvotes: newUpvotes,
      verificationCount: newVerificationCount,
      status: newStatus,
      pointsAwarded: 10
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/issues/:id/status — Update issue status.
 */
async function updateIssueStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.uid;

    const validStatuses = ["open", "verified", "assigned", "in_progress", "resolved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`, code: "INVALID_STATUS" });
    }

    const issueSnap = await db.collection("issues").doc(id).get();
    if (!issueSnap.exists) {
      return res.status(404).json({ error: "Issue not found", code: "ISSUE_NOT_FOUND" });
    }

    const issue = issueSnap.data();

    // Check authorization: must be reporter or Gold+ user
    const userSnap = await db.collection("users").doc(userId).get();
    const userTier = userSnap.data()?.tier || "Bronze";
    const isReporter = issue.reporterId === userId;
    const isGoldPlus = ["Gold", "Platinum"].includes(userTier);

    if (!isReporter && !isGoldPlus) {
      return res.status(403).json({ error: "Only the reporter or Gold+ users can update status", code: "UNAUTHORIZED" });
    }

    const updates = {
      status,
      updatedAt: FieldValue.serverTimestamp()
    };

    if (status === "resolved") {
      updates.resolvedAt = FieldValue.serverTimestamp();
    }

    await db.collection("issues").doc(id).update(updates);

    res.json({ id, status, message: "Issue status updated" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/issues/:id/resolve — Mark issue as resolved.
 */
async function resolveIssue(req, res, next) {
  try {
    const { id } = req.params;

    const issueSnap = await db.collection("issues").doc(id).get();
    if (!issueSnap.exists) {
      return res.status(404).json({ error: "Issue not found", code: "ISSUE_NOT_FOUND" });
    }

    const issue = issueSnap.data();

    // Update issue status
    await db.collection("issues").doc(id).update({
      status: "resolved",
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award +25 bonus points to reporter
    await trustService.addPoints(issue.reporterId, "issue_resolved_bonus", id, "issue");

    // Award +5 points to each verifier
    if (issue.verifiedBy && issue.verifiedBy.length > 0) {
      for (const verifierUid of issue.verifiedBy) {
        try {
          await trustService.addPoints(verifierUid, "verifier_resolved", id, "issue");
        } catch (err) {
          console.warn(`Failed to award verifier points to ${verifierUid}:`, err.message);
        }
      }
    }

    // Notify reporter
    await trustService.addNotification(
      issue.reporterId, "issue_resolved",
      "Issue Resolved! 🎉 +25 bonus pts",
      `Your issue "${issue.description.slice(0, 50)}..." has been resolved.`,
      id
    );

    // Get updated issue
    const updatedSnap = await db.collection("issues").doc(id).get();

    res.json({
      id,
      status: "resolved",
      message: "Issue resolved successfully",
      reporterBonusPoints: 25,
      verifiersRewarded: (issue.verifiedBy || []).length
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/issues/nearby — Issues within radius of lat/lng.
 */
async function getNearbyIssues(req, res, next) {
  try {
    const {
      lat, lng, radius = 2000,
      status, category, limit = 20
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required", code: "MISSING_COORDINATES" });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseInt(radius);

    // Bounding box approach for Firestore
    const { minLat, maxLat } = getBoundingBox(latNum, lngNum, radiusNum);

    let query = db.collection("issues")
      .where("lat", ">=", minLat)
      .where("lat", "<=", maxLat)
      .limit(100); // Fetch more than needed, filter in memory

    const snap = await query.get();
    let issues = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by actual Haversine distance
    issues = issues.filter(issue => {
      if (!issue.lat || !issue.lng) return false;
      const distance = haversineDistance(latNum, lngNum, issue.lat, issue.lng);
      issue.distance = Math.round(distance);
      return distance <= radiusNum;
    });

    // Apply additional filters
    if (status) issues = issues.filter(i => i.status === status);
    if (category) issues = issues.filter(i => i.category === category);

    // Sort by distance
    issues.sort((a, b) => a.distance - b.distance);

    // Apply limit
    issues = issues.slice(0, parseInt(limit));

    res.json({ issues, count: issues.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/issues/stats — Issue statistics by ward/city.
 */
async function getIssueStats(req, res, next) {
  try {
    const { city = "Latur", ward } = req.query;

    let query = db.collection("issues").where("city", "==", city);
    if (ward) query = query.where("ward", "==", ward);

    const snap = await query.get();
    const issues = snap.docs.map(doc => doc.data());

    // Aggregate stats
    const stats = {
      total: issues.length,
      open: issues.filter(i => i.status === "open").length,
      verified: issues.filter(i => i.status === "verified").length,
      inProgress: issues.filter(i => i.status === "in_progress").length,
      resolved: issues.filter(i => i.status === "resolved").length,
      rejected: issues.filter(i => i.status === "rejected").length,
      byCategory: {},
      bySeverity: {},
      byWard: {}
    };

    issues.forEach(issue => {
      stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
      stats.byWard[issue.ward] = (stats.byWard[issue.ward] || 0) + 1;
    });

    res.json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/issues/ai-classify — Classify a civic infrastructure issue image before submission.
 */
async function aiClassify(req, res, next) {
  try {
    const { photoBase64, description } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ error: "photoBase64 is required", code: "MISSING_PHOTO" });
    }
    const aiResult = await geminiService.classifyIssue(description || "", photoBase64);
    res.json(aiResult);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createIssue,
  listIssues,
  getIssue,
  upvoteIssue,
  updateIssueStatus,
  resolveIssue,
  getNearbyIssues,
  getIssueStats,
  aiClassify
};
