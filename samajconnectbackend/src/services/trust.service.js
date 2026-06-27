const { db, FieldValue } = require("../config/firebase");

// ─── Trust Point Events ──────────────────────────────────────────────────────
const TRUST_EVENTS = {
  issue_reported:         { points: 50,  description: "Reported a community issue" },
  issue_verified:         { points: 10,  description: "Verified a neighbor's report" },
  issue_resolved_bonus:   { points: 25,  description: "Your reported issue got resolved" },
  verifier_resolved:      { points: 5,   description: "An issue you verified got resolved" },
  question_asked:         { points: 5,   description: "Posted a question on the hub" },
  answer_given:           { points: 15,  description: "Answered a community question" },
  answer_accepted:        { points: 25,  description: "Your answer was marked as solved" },
  journey_completed:      { points: 5,   description: "Completed a safe journey check-in" },
  item_listed:            { points: 5,   description: "Listed an item on marketplace" },
  item_donated:           { points: 30,  description: "Donated an item to community" },
  item_transacted:        { points: 15,  description: "Completed a marketplace transaction" },
  aqi_data_contributed:   { points: 2,   description: "Contributed AQI sensor data" },
  doctor_surge_mode:      { points: 3,   description: "Enabled surge mode during AQI alert" },
  invalid_report:         { points: -20, description: "Issue flagged as invalid by community" },
  bad_rating:             { points: -15, description: "Received a bad transaction rating" },
};

// ─── Tier Definitions ────────────────────────────────────────────────────────
const TIERS = [
  { name: "Bronze",   min: 0,    max: 300,      color: "#CD7F32" },
  { name: "Silver",   min: 301,  max: 800,      color: "#C0C0C0" },
  { name: "Gold",     min: 801,  max: 2000,     color: "#FFD700" },
  { name: "Platinum", min: 2001, max: Infinity,  color: "#C084FC" },
];

/**
 * Get tier name based on trust score.
 */
function getTier(score) {
  return TIERS.find(t => score >= t.min && score <= t.max)?.name || "Bronze";
}

/**
 * Get the next tier above the current one.
 */
function getNextTier(currentTier) {
  const idx = TIERS.findIndex(t => t.name === currentTier);
  return TIERS[idx + 1] || null;
}

/**
 * Calculate points needed to reach the next tier.
 */
function getPointsToNextTier(score, currentTier) {
  const next = getNextTier(currentTier);
  if (!next) return 0;
  return next.min - score;
}

/**
 * Add trust score points for a user action.
 * Updates user's trustScore and tier, logs the event.
 */
async function addPoints(userId, eventKey, referenceId = null, referenceType = null) {
  const event = TRUST_EVENTS[eventKey];
  if (!event) throw new Error(`Unknown trust event: ${eventKey}`);

  const batch = db.batch();

  // Update user trust score
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  const currentScore = userSnap.data()?.trustScore || 0;
  const newScore = Math.max(0, currentScore + event.points);
  const newTier = getTier(newScore);

  batch.update(userRef, {
    trustScore: newScore,
    tier: newTier,
    updatedAt: FieldValue.serverTimestamp()
  });

  // Log trust event
  const eventRef = db.collection("trust_events").doc();
  batch.set(eventRef, {
    userId,
    event: eventKey,
    points: event.points,
    referenceId,
    referenceType,
    description: event.description,
    createdAt: FieldValue.serverTimestamp()
  });

  await batch.commit();
  return { newScore, newTier, pointsAdded: event.points };
}

/**
 * Add a notification for a user.
 */
async function addNotification(userId, type, title, body, referenceId = null) {
  await db.collection("notifications").add({
    userId, type, title, body, referenceId,
    isRead: false,
    createdAt: FieldValue.serverTimestamp()
  });
}

module.exports = { addPoints, getTier, getNextTier, getPointsToNextTier, addNotification, TRUST_EVENTS, TIERS };
