const { db } = require("../config/firebase");
const geminiService = require("../services/gemini.service");

/**
 * GET /api/dashboard/stats — Overall community stats.
 */
async function getStats(req, res, next) {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Latur";
    const ward = req.query.ward;

    // Run parallel Firestore queries
    const queries = [
      db.collection("issues").where("city", "==", city).get(),
      db.collection("questions").where("city", "==", city).get(),
      db.collection("listings").where("city", "==", city).get(),
      db.collection("users").where("city", "==", city).get()
    ];

    if (ward) {
      // Override with ward-specific queries
      queries[0] = db.collection("issues").where("city", "==", city).where("ward", "==", ward).get();
      queries[1] = db.collection("questions").where("city", "==", city).where("ward", "==", ward).get();
      queries[2] = db.collection("listings").where("city", "==", city).where("ward", "==", ward).get();
      queries[3] = db.collection("users").where("city", "==", city).where("ward", "==", ward).get();
    }

    const [issueSnap, questionSnap, listingSnap, userSnap] = await Promise.all(queries);

    const issues = issueSnap.docs.map(d => d.data());
    const questions = questionSnap.docs.map(d => d.data());
    const listings = listingSnap.docs.map(d => d.data());
    const users = userSnap.docs.map(d => d.data());

    const totalIssues = issues.length;
    const resolvedIssues = issues.filter(i => i.status === "resolved").length;
    const openIssues = issues.filter(i => i.status === "open").length;
    const resolutionRate = totalIssues > 0 ? `${Math.round((resolvedIssues / totalIssues) * 100)}%` : "0%";

    const totalQuestions = questions.length;
    const solvedQuestions = questions.filter(q => q.status === "solved").length;

    const totalListings = listings.length;
    const donatedItems = listings.filter(l => l.listingType === "donate").length;

    const activeUsers = users.length;
    const totalTrustPoints = users.reduce((sum, u) => sum + (u.trustScore || 0), 0);

    // Count AQI alerts this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let aqiAlertsThisMonth = 0;
    try {
      const aqiSnap = await db.collection("aqi_readings")
        .where("city", "==", city)
        .where("alertLevel", "in", ["unhealthy", "very_unhealthy", "hazardous"])
        .where("recordedAt", ">=", monthStart)
        .get();
      aqiAlertsThisMonth = aqiSnap.size;
    } catch (err) {
      console.warn("AQI alerts count failed:", err.message);
    }

    res.json({
      totalIssues,
      resolvedIssues,
      openIssues,
      resolutionRate,
      totalQuestions,
      solvedQuestions,
      totalListings,
      donatedItems,
      activeUsers,
      totalTrustPoints,
      aqiAlertsThisMonth,
      city,
      ward: ward || "all"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/issues-chart — Issues by category/status for charts.
 */
async function getIssuesChart(req, res, next) {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Latur";

    const snap = await db.collection("issues").where("city", "==", city).get();
    const issues = snap.docs.map(d => d.data());

    // By category
    const byCategory = {};
    issues.forEach(i => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    });

    // By status
    const byStatus = {};
    issues.forEach(i => {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    });

    // By severity
    const bySeverity = {};
    issues.forEach(i => {
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    });

    // By ward
    const byWard = {};
    issues.forEach(i => {
      byWard[i.ward] = (byWard[i.ward] || 0) + 1;
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = {};
    issues.forEach(i => {
      if (i.createdAt) {
        const date = i.createdAt.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1;
      }
    });

    res.json({
      byCategory,
      byStatus,
      bySeverity,
      byWard,
      monthlyTrend,
      total: issues.length
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/aqi-history — AQI trend data for chart.
 */
async function getAqiHistory(req, res, next) {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Latur";
    const days = parseInt(req.query.days) || 7;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const snap = await db.collection("aqi_readings")
      .where("city", "==", city)
      .where("recordedAt", ">=", cutoff)
      .orderBy("recordedAt", "asc")
      .limit(200)
      .get();

    const readings = snap.docs.map(doc => {
      const data = doc.data();
      return {
        aqi: data.aqi,
        pm25: data.pm25,
        pm10: data.pm10,
        temperature: data.temperature,
        humidity: data.humidity,
        alertLevel: data.alertLevel,
        recordedAt: data.recordedAt
      };
    });

    res.json({ readings, count: readings.length, city, days });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/impact — AI-generated community insight.
 */
async function getImpact(req, res, next) {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Latur";

    // Fetch recent issues
    const snap = await db.collection("issues")
      .where("city", "==", city)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const issues = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (issues.length === 0) {
      return res.json({
        insight: {
          totalOpen: 0,
          criticalCount: 0,
          topCategory: "none",
          topWard: "none",
          resolutionRate: "0%",
          insight: "No issues reported yet. Be the first to report!"
        }
      });
    }

    const summary = await geminiService.generateIssueSummary(issues);

    res.json({ insight: summary, city, issuesAnalyzed: issues.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/top-contributors — Top contributors across all modules.
 */
async function getTopContributors(req, res, next) {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Latur";
    const limit = parseInt(req.query.limit) || 10;

    const snap = await db.collection("users")
      .where("city", "==", city)
      .orderBy("trustScore", "desc")
      .limit(limit)
      .get();

    const contributors = [];

    for (const doc of snap.docs) {
      const user = doc.data();

      // Get activity counts
      const [issuesSnap, answersSnap, listingsSnap] = await Promise.all([
        db.collection("issues").where("reporterId", "==", doc.id).get(),
        db.collectionGroup("answers").where("expertId", "==", doc.id).get(),
        db.collection("listings").where("sellerId", "==", doc.id).get()
      ]);

      contributors.push({
        uid: doc.id,
        name: user.name,
        photoUrl: user.photoUrl,
        trustScore: user.trustScore || 0,
        tier: user.tier,
        badges: user.badges || [],
        ward: user.ward,
        activities: {
          issuesReported: issuesSnap.size,
          answersGiven: answersSnap.size,
          itemsListed: listingsSnap.size
        }
      });
    }

    res.json({ contributors, count: contributors.length, city });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getIssuesChart,
  getAqiHistory,
  getImpact,
  getTopContributors
};
