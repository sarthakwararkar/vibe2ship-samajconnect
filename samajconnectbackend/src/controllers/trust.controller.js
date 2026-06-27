const { db } = require("../config/firebase");
const trustService = require("../services/trust.service");

/**
 * GET /api/trust/score/:uid — Get Trust Score + tier + stats.
 */
async function getTrustScore(req, res, next) {
  try {
    const { uid } = req.params;

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
    }

    const user = userSnap.data();
    const currentTier = user.tier || "Bronze";
    const nextTier = trustService.getNextTier(currentTier);
    const pointsToNext = trustService.getPointsToNextTier(user.trustScore || 0, currentTier);

    // Count activities
    const [issuesSnap, questionsSnap, answersSnap, listingsSnap] = await Promise.all([
      db.collection("issues").where("reporterId", "==", uid).get(),
      db.collection("questions").where("askerId", "==", uid).get(),
      db.collectionGroup("answers").where("expertId", "==", uid).get(),
      db.collection("listings").where("sellerId", "==", uid).get()
    ]);

    res.json({
      uid,
      name: user.name,
      trustScore: user.trustScore || 0,
      tier: currentTier,
      tierColor: trustService.TIERS.find(t => t.name === currentTier)?.color || "#CD7F32",
      nextTier: nextTier?.name || null,
      pointsToNextTier: pointsToNext,
      badges: user.badges || [],
      stats: {
        issuesReported: issuesSnap.size,
        questionsAsked: questionsSnap.size,
        answersGiven: answersSnap.size,
        itemsListed: listingsSnap.size
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trust/leaderboard — Ward leaderboard.
 */
async function getLeaderboard(req, res, next) {
  try {
    const {
      ward, city = "Latur",
      limit = 10, period = "alltime"
    } = req.query;

    if (period === "weekly") {
      // Weekly leaderboard: aggregate trust events from last 7 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);

      let eventsQuery = db.collection("trust_events")
        .where("createdAt", ">=", cutoff)
        .orderBy("createdAt", "desc")
        .limit(500);

      const eventsSnap = await eventsQuery.get();
      const pointsByUser = {};

      eventsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!pointsByUser[data.userId]) {
          pointsByUser[data.userId] = { userId: data.userId, weeklyPoints: 0 };
        }
        pointsByUser[data.userId].weeklyPoints += data.points || 0;
      });

      // Get user details and sort
      const userIds = Object.keys(pointsByUser);
      const leaderboard = [];

      for (const userId of userIds) {
        const userSnap = await db.collection("users").doc(userId).get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          // Filter by city/ward if specified
          if (city && userData.city !== city) continue;
          if (ward && userData.ward !== ward) continue;

          leaderboard.push({
            rank: 0,
            uid: userId,
            name: userData.name,
            trustScore: userData.trustScore || 0,
            weeklyPoints: pointsByUser[userId].weeklyPoints,
            tier: userData.tier,
            badges: userData.badges || []
          });
        }
      }

      leaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      leaderboard.forEach((entry, idx) => { entry.rank = idx + 1; });

      return res.json({
        leaderboard: leaderboard.slice(0, parseInt(limit)),
        period: "weekly",
        city,
        ward: ward || "all"
      });
    }

    // All-time leaderboard
    let query = db.collection("users")
      .where("city", "==", city)
      .orderBy("trustScore", "desc")
      .limit(parseInt(limit));

    // Note: Firestore can't do orderBy + multiple where in some cases, so we filter in memory if ward specified
    if (!ward) {
      const snap = await query.get();
      const leaderboard = snap.docs.map((doc, idx) => ({
        rank: idx + 1,
        uid: doc.id,
        name: doc.data().name,
        trustScore: doc.data().trustScore || 0,
        tier: doc.data().tier,
        badges: doc.data().badges || [],
        ward: doc.data().ward
      }));

      return res.json({ leaderboard, period: "alltime", city, ward: "all" });
    }

    // With ward filter
    const snap = await db.collection("users")
      .where("city", "==", city)
      .where("ward", "==", ward)
      .orderBy("trustScore", "desc")
      .limit(parseInt(limit))
      .get();

    const leaderboard = snap.docs.map((doc, idx) => ({
      rank: idx + 1,
      uid: doc.id,
      name: doc.data().name,
      trustScore: doc.data().trustScore || 0,
      tier: doc.data().tier,
      badges: doc.data().badges || [],
      ward: doc.data().ward
    }));

    res.json({ leaderboard, period: "alltime", city, ward });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trust/history/:uid — Trust Score event history.
 */
async function getTrustHistory(req, res, next) {
  try {
    const { uid } = req.params;
    const authUid = req.user.uid;

    // Can only view own history
    if (uid !== authUid) {
      return res.status(403).json({ error: "You can only view your own trust history", code: "UNAUTHORIZED" });
    }

    const limit = parseInt(req.query.limit) || 50;

    const snap = await db.collection("trust_events")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ events, count: events.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trust/badges/:uid — Get user badges.
 */
async function getBadges(req, res, next) {
  try {
    const { uid } = req.params;

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
    }

    const badges = userSnap.data().badges || [];

    // Badge definitions
    const badgeDefinitions = {
      "expert_solver": { name: "Expert Solver", description: "10+ accepted answers", icon: "🏆" },
      "first_report": { name: "First Report", description: "Reported your first issue", icon: "📋" },
      "community_hero": { name: "Community Hero", description: "Reached Gold tier", icon: "🦸" },
      "helping_hand": { name: "Helping Hand", description: "Donated 5+ items", icon: "🤝" },
      "watchdog": { name: "Watchdog", description: "Verified 20+ issues", icon: "👁️" },
      "safety_champion": { name: "Safety Champion", description: "Completed 10+ safe journeys", icon: "🛡️" },
      "air_guardian": { name: "Air Guardian", description: "Contributed 50+ AQI readings", icon: "🌬️" }
    };

    const userBadges = badges.map(key => ({
      key,
      ...badgeDefinitions[key] || { name: key, description: "", icon: "⭐" }
    }));

    res.json({ badges: userBadges, count: userBadges.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trust/tiers — Get all tier definitions.
 */
async function getTiers(req, res, next) {
  try {
    const tiers = trustService.TIERS.map(t => ({
      name: t.name,
      minPoints: t.min,
      maxPoints: t.max === Infinity ? null : t.max,
      color: t.color
    }));

    res.json({ tiers });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTrustScore,
  getLeaderboard,
  getTrustHistory,
  getBadges,
  getTiers
};
