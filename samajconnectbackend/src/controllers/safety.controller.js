const { db, FieldValue } = require("../config/firebase");
const geminiService = require("../services/gemini.service");
const trustService = require("../services/trust.service");
const { haversineDistance, getBoundingBox } = require("../services/firestore.service");

/**
 * GET /api/safety/circle — Get user's trusted circle.
 */
async function getTrustedCircle(req, res, next) {
  try {
    const uid = req.user.uid;
    const circleSnap = await db.collection("trusted_circles").doc(uid).get();

    if (!circleSnap.exists) {
      return res.json({ id: uid, userId: uid, circle: [], contacts: [] });
    }

    const data = circleSnap.data();
    const contacts = (data.contacts || []).map(c => ({
      ...c,
      uid: c.contactUid || c.uid
    }));

    res.json({ id: uid, userId: uid, circle: contacts, contacts });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/safety/circle — Add contact to trusted circle.
 */
async function addToCircle(req, res, next) {
  try {
    const uid = req.user.uid;
    let { contactUid, name, phone, email, relationship } = req.body;

    // Look up registered user by email if provided
    if (email && (!contactUid || !name)) {
      const userQuery = await db.collection("users").where("email", "==", email).limit(1).get();
      if (userQuery.empty) {
        return res.status(404).json({ error: "User with this email is not registered in SamajConnect", code: "USER_NOT_FOUND" });
      }
      const userDoc = userQuery.docs[0].data();
      contactUid = userDoc.uid || userQuery.docs[0].id;
      name = userDoc.name;
      phone = userDoc.phone || null;
      email = userDoc.email;
    }

    if (!name) {
      return res.status(400).json({ error: "Contact name is required", code: "MISSING_NAME" });
    }

    const contact = {
      contactUid: contactUid || null,
      uid: contactUid || null,
      name,
      phone: phone || null,
      email: email || null,
      relationship: relationship || "Friend",
      isOnApp: !!contactUid,
      addedAt: new Date().toISOString()
    };

    const circleRef = db.collection("trusted_circles").doc(uid);
    const circleSnap = await circleRef.get();

    if (circleSnap.exists) {
      const existingContacts = circleSnap.data().contacts || [];
      const isDuplicate = existingContacts.some(c =>
        (c.contactUid && c.contactUid === contactUid) ||
        (c.phone && c.phone === phone) ||
        (c.email && c.email === email)
      );

      if (isDuplicate) {
        return res.status(400).json({ error: "Contact already in trusted circle", code: "DUPLICATE_CONTACT" });
      }

      await circleRef.update({
        contacts: FieldValue.arrayUnion(contact),
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      await circleRef.set({
        userId: uid,
        contacts: [contact],
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({ message: "Contact added to trusted circle", contact });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/safety/circle/:contactUid — Remove contact from trusted circle.
 */
async function removeFromCircle(req, res, next) {
  try {
    const uid = req.user.uid;
    const { contactUid } = req.params;

    const circleRef = db.collection("trusted_circles").doc(uid);
    const circleSnap = await circleRef.get();

    if (!circleSnap.exists) {
      return res.status(404).json({ error: "Trusted circle not found", code: "CIRCLE_NOT_FOUND" });
    }

    const contacts = circleSnap.data().contacts || [];
    const updatedContacts = contacts.filter(c => c.contactUid !== contactUid && c.uid !== contactUid);

    if (updatedContacts.length === contacts.length) {
      return res.status(404).json({ error: "Contact not found in circle", code: "CONTACT_NOT_FOUND" });
    }

    await circleRef.update({
      contacts: updatedContacts,
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ message: "Contact removed from trusted circle" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/safety/journey/start — Start a journey.
 */
async function startJourney(req, res, next) {
  try {
    const uid = req.user.uid;
    const {
      fromAddress, toAddress,
      fromLat, fromLng, toLat, toLng,
      expectedArrivalMinutes = 30,
      notifyContacts = []
    } = req.body;

    if (!fromAddress || !toAddress) {
      return res.status(400).json({ error: "fromAddress and toAddress are required", code: "MISSING_ADDRESSES" });
    }

    // Get user name
    const userSnap = await db.collection("users").doc(uid).get();
    const userName = userSnap.data()?.name || "User";

    // Get risk zones along route (bounding box of start/end points)
    const minLat = Math.min(fromLat || 0, toLat || 0) - 0.01;
    const maxLat = Math.max(fromLat || 0, toLat || 0) + 0.01;
    const minLng = Math.min(fromLng || 0, toLng || 0) - 0.01;
    const maxLng = Math.max(fromLng || 0, toLng || 0) + 0.01;

    const riskZonesSnap = await db.collection("risk_zones")
      .where("lat", ">=", minLat)
      .where("lat", "<=", maxLat)
      .get();

    const riskZones = riskZonesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(z => z.lng >= minLng && z.lng <= maxLng);

    // AI route risk analysis
    const currentTime = new Date().toLocaleTimeString("en-IN", { hour12: false });
    let riskAnalysis = null;
    try {
      riskAnalysis = await geminiService.analyzeRouteRisk(fromAddress, toAddress, currentTime, riskZones);
    } catch (err) {
      console.warn("Route risk analysis failed:", err.message);
    }

    // Calculate expected arrival time
    const expectedArrival = new Date(Date.now() + expectedArrivalMinutes * 60 * 1000);

    // Create journey document
    const journeyRef = db.collection("journeys").doc();
    await journeyRef.set({
      userId: uid,
      userName,
      fromAddress,
      toAddress,
      fromLat: fromLat || null,
      fromLng: fromLng || null,
      toLat: toLat || null,
      toLng: toLng || null,
      expectedArrival,
      status: "active",
      trustedCircle: notifyContacts,
      riskZonesOnRoute: riskZones.map(z => z.id),
      aiRiskLevel: riskAnalysis?.overallRisk || "low",
      aiRiskAdvice: riskAnalysis?.advice || null,
      checkedInAt: null,
      sosActivatedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award +5 points for starting journey
    await trustService.addPoints(uid, "journey_completed", journeyRef.id, "journey");

    // Notify trusted circle contacts
    for (const contactUid of notifyContacts) {
      try {
        await trustService.addNotification(
          contactUid, "journey_started",
          "Journey Started 🚶",
          `${userName} has started a journey from ${fromAddress} to ${toAddress}. Expected arrival: ${expectedArrivalMinutes} minutes.`,
          journeyRef.id
        );
      } catch (err) {
        console.warn(`Failed to notify contact ${contactUid}:`, err.message);
      }
    }

    res.status(201).json({
      id: journeyRef.id,
      status: "active",
      expectedArrival: expectedArrival.toISOString(),
      riskAnalysis,
      riskZonesOnRoute: riskZones.length,
      message: "Journey started successfully",
      pointsAwarded: 5
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/safety/journey/:id/checkin — Check in safely.
 */
async function checkInJourney(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const journeySnap = await db.collection("journeys").doc(id).get();
    if (!journeySnap.exists) {
      return res.status(404).json({ error: "Journey not found", code: "JOURNEY_NOT_FOUND" });
    }

    const journey = journeySnap.data();
    if (journey.userId !== uid) {
      return res.status(403).json({ error: "Not your journey", code: "UNAUTHORIZED" });
    }

    await db.collection("journeys").doc(id).update({
      status: "completed",
      checkedInAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Notify trusted circle
    for (const contactUid of (journey.trustedCircle || [])) {
      try {
        await trustService.addNotification(
          contactUid, "journey_completed",
          "Safe Arrival ✅",
          `${journey.userName} has checked in safely at ${journey.toAddress}.`,
          id
        );
      } catch (err) {
        console.warn(`Failed to notify contact ${contactUid}:`, err.message);
      }
    }

    res.json({ message: "Checked in safely", status: "completed" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/safety/journey/active — Get current active journey.
 */
async function getActiveJourney(req, res, next) {
  try {
    const uid = req.user.uid;

    const snap = await db.collection("journeys")
      .where("userId", "==", uid)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return res.json({ journey: null, message: "No active journey" });
    }

    const journey = { id: snap.docs[0].id, ...snap.docs[0].data() };
    res.json({ journey });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/safety/journey/history — Get user's past journeys.
 */
async function getJourneyHistory(req, res, next) {
  try {
    const uid = req.user.uid;
    const limit = parseInt(req.query.limit) || 20;

    const snap = await db.collection("journeys")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const journeys = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ journeys, count: journeys.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/safety/sos — Activate SOS.
 */
async function activateSos(req, res, next) {
  try {
    const uid = req.user.uid;
    const { lat, lng, address } = req.body;

    // Get user info
    const userSnap = await db.collection("users").doc(uid).get();
    const userName = userSnap.data()?.name || "User";

    // Create SOS event
    const sosRef = db.collection("sos_events").doc();
    const trustedCircleNotified = [];

    // Get user's trusted circle
    const circleSnap = await db.collection("trusted_circles").doc(uid).get();
    const contacts = circleSnap.exists ? (circleSnap.data().contacts || []) : [];

    // Notify each trusted contact
    for (const contact of contacts) {
      if (contact.contactUid) {
        trustedCircleNotified.push(contact.contactUid);
        await trustService.addNotification(
          contact.contactUid, "sos_alert",
          "⚠️ SOS Alert",
          `${userName} has activated SOS at ${address || "unknown location"}. Check the app immediately.`,
          sosRef.id
        );
      }
    }

    // Find Gold+ users within 1km who could help (community guards)
    let guardsNotified = 0;
    if (lat && lng) {
      const { minLat, maxLat } = getBoundingBox(lat, lng, 1000);
      const nearbyUsersSnap = await db.collection("users")
        .where("tier", "in", ["Gold", "Platinum"])
        .where("lat", ">=", minLat)
        .where("lat", "<=", maxLat)
        .limit(10)
        .get();

      for (const doc of nearbyUsersSnap.docs) {
        if (doc.id !== uid) {
          const distance = haversineDistance(lat, lng, doc.data().lat, doc.data().lng);
          if (distance <= 1000) {
            guardsNotified++;
            await trustService.addNotification(
              doc.id, "sos_alert",
              "🚨 Nearby SOS",
              `A community member needs help at ${address || "nearby location"}.`,
              sosRef.id
            );
          }
        }
      }
    }

    await sosRef.set({
      userId: uid,
      userName,
      lat: lat || null,
      lng: lng || null,
      address: address || "",
      trustedCircleNotified,
      status: "active",
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp()
    });

    // Update active journey status to "sos" if exists
    const activeJourneySnap = await db.collection("journeys")
      .where("userId", "==", uid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!activeJourneySnap.empty) {
      await activeJourneySnap.docs[0].ref.update({
        status: "sos",
        sosActivatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({
      id: sosRef.id,
      status: "active",
      trustedCircleNotified,
      guardsNotified,
      message: "SOS activated. Your trusted circle and nearby community guards have been notified."
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/safety/sos/:id/resolve — Resolve SOS.
 */
async function resolveSos(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const sosSnap = await db.collection("sos_events").doc(id).get();
    if (!sosSnap.exists) {
      return res.status(404).json({ error: "SOS event not found", code: "SOS_NOT_FOUND" });
    }

    const sos = sosSnap.data();
    if (sos.userId !== uid) {
      return res.status(403).json({ error: "Only the SOS creator can resolve it", code: "UNAUTHORIZED" });
    }

    await db.collection("sos_events").doc(id).update({
      status: "resolved",
      resolvedAt: FieldValue.serverTimestamp()
    });

    // Notify trusted circle that SOS is resolved
    for (const contactUid of (sos.trustedCircleNotified || [])) {
      await trustService.addNotification(
        contactUid, "sos_resolved",
        "✅ SOS Resolved",
        `${sos.userName} has marked the SOS alert as resolved. They are safe.`,
        id
      );
    }

    res.json({ message: "SOS resolved", status: "resolved" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/safety/risk-zones — Get risk zones near location.
 */
async function getRiskZones(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat) || parseFloat(process.env.DEFAULT_LAT) || 18.4088;
    const lng = parseFloat(req.query.lng) || parseFloat(process.env.DEFAULT_LNG) || 76.5604;
    const radius = parseInt(req.query.radius) || 5000;

    const { minLat, maxLat } = getBoundingBox(lat, lng, radius);

    const snap = await db.collection("risk_zones")
      .where("lat", ">=", minLat)
      .where("lat", "<=", maxLat)
      .get();

    let zones = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(z => {
        const distance = haversineDistance(lat, lng, z.lat, z.lng);
        z.distance = Math.round(distance);
        return distance <= radius;
      })
      .sort((a, b) => a.distance - b.distance);

    res.json({ riskZones: zones, count: zones.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/safety/incident — Report an incident anonymously.
 */
async function reportIncident(req, res, next) {
  try {
    const uid = req.user.uid;
    const { lat, lng, address, ward, city, description } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required", code: "MISSING_COORDINATES" });
    }

    // Check if a risk zone already exists nearby (within 200m)
    const existingZonesSnap = await db.collection("risk_zones")
      .where("city", "==", city || "Latur")
      .get();

    let existingZone = null;
    for (const doc of existingZonesSnap.docs) {
      const zone = doc.data();
      const distance = haversineDistance(lat, lng, zone.lat, zone.lng);
      if (distance <= 200) {
        existingZone = { id: doc.id, ...zone };
        break;
      }
    }

    if (existingZone) {
      // Update existing risk zone
      await db.collection("risk_zones").doc(existingZone.id).update({
        incidentCount: (existingZone.incidentCount || 0) + 1,
        lastIncident: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      // Create new risk zone
      const currentHour = new Date().getHours();
      const timeSlot = `${String(currentHour).padStart(2, "0")}:00-${String((currentHour + 2) % 24).padStart(2, "0")}:00`;

      await db.collection("risk_zones").add({
        lat, lng,
        radiusMeters: 200,
        address: address || "",
        ward: ward || "",
        city: city || "Latur",
        incidentCount: 1,
        highRiskTimeSlots: [timeSlot],
        lastIncident: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({ message: "Incident reported anonymously. Thank you for keeping the community safe." });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/safety/route-analysis — Analyze route safety using AI.
 */
async function analyzeRoute(req, res, next) {
  try {
    const { fromAddress, toAddress, fromLat, fromLng, toLat, toLng } = req.body;

    if (!fromAddress || !toAddress) {
      return res.status(400).json({ error: "fromAddress and toAddress are required", code: "MISSING_ADDRESSES" });
    }

    // Get risk zones along route
    const minLat = Math.min(fromLat || 0, toLat || 0) - 0.01;
    const maxLat = Math.max(fromLat || 0, toLat || 0) + 0.01;

    const riskZonesSnap = await db.collection("risk_zones")
      .where("lat", ">=", minLat)
      .where("lat", "<=", maxLat)
      .get();

    const riskZones = riskZonesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const currentTime = new Date().toLocaleTimeString("en-IN", { hour12: false });
    const analysis = await geminiService.analyzeRouteRisk(fromAddress, toAddress, currentTime, riskZones);

    res.json({
      analysis,
      riskZonesOnRoute: riskZones.length,
      riskZones: riskZones.map(z => ({
        address: z.address,
        incidentCount: z.incidentCount,
        highRiskTimeSlots: z.highRiskTimeSlots
      }))
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/safety/disasters — Report a disaster event and broadcast alerts.
 */
async function reportDisaster(req, res, next) {
  try {
    const uid = req.user.uid;
    const { type, description, lat, lng, address, city } = req.body;

    if (!type || !description || !lat || !lng) {
      return res.status(400).json({ error: "type, description, lat, and lng are required", code: "INVALID_DISASTER_PARAMS" });
    }

    // Retrieve reporter name from user profile
    const userSnap = await db.collection("users").doc(uid).get();
    const userName = userSnap.data()?.name || "A community member";

    // 1. Create disaster alert record in Firestore
    const disasterRef = db.collection("disasters").doc();
    const disasterData = {
      id: disasterRef.id,
      reporterId: uid,
      reporterName: userName,
      type,
      description,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || "",
      city: city || "Latur",
      status: "active",
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    await disasterRef.set(disasterData);

    // 2. Broadcast alerts to all users within 5km (5000 meters)
    let usersNotified = 0;
    const { minLat, maxLat } = getBoundingBox(lat, lng, 5000);
    const usersSnap = await db.collection("users")
      .where("lat", ">=", minLat)
      .where("lat", "<=", maxLat)
      .get();

    for (const doc of usersSnap.docs) {
      if (doc.id !== uid) {
        const u = doc.data();
        if (u.lat && u.lng) {
          const distance = haversineDistance(lat, lng, u.lat, u.lng);
          if (distance <= 5000) {
            usersNotified++;
            await trustService.addNotification(
              doc.id,
              "disaster_alert",
              `🚨 URGENT DISASTER: ${type.toUpperCase()}`,
              `${description} reported at ${address || "nearby location"}. Stay safe!`,
              disasterRef.id
            );
          }
        }
      }
    }

    res.status(201).json({ 
      message: "Disaster alert reported and broadcasted to nearby users successfully.", 
      disaster: disasterData,
      usersNotified 
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/safety/disasters/active — Get active disasters near location.
 */
async function getActiveDisasters(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat) || parseFloat(process.env.DEFAULT_LAT) || 18.4088;
    const lng = parseFloat(req.query.lng) || parseFloat(process.env.DEFAULT_LNG) || 76.5604;
    const radius = parseInt(req.query.radius) || 5000;

    const { minLat, maxLat } = getBoundingBox(lat, lng, radius);
    const disastersSnap = await db.collection("disasters")
      .where("status", "==", "active")
      .where("lat", ">=", minLat)
      .where("lat", "<=", maxLat)
      .get();

    const disasters = disastersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(d => {
        const distance = haversineDistance(lat, lng, d.lat, d.lng);
        d.distance = Math.round(distance);
        return distance <= radius;
      })
      .sort((a, b) => a.distance - b.distance);

    res.json({ disasters, count: disasters.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/safety/disasters/:id/resolve — Resolve a disaster alert.
 */
async function resolveDisaster(req, res, next) {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    // Check user authority role or trust tier
    const userSnap = await db.collection("users").doc(uid).get();
    const u = userSnap.data();
    const isAuthority = u?.isAuthority || u?.isExpert || u?.tier === "Platinum";

    if (!isAuthority) {
      return res.status(403).json({ error: "Only government authorities or community experts can resolve disaster alerts.", code: "UNAUTHORIZED_RESOLVE" });
    }

    const disasterRef = db.collection("disasters").doc(id);
    const disasterSnap = await disasterRef.get();
    if (!disasterSnap.exists) {
      return res.status(404).json({ error: "Disaster alert not found", code: "NOT_FOUND" });
    }

    await disasterRef.update({
      status: "resolved",
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ message: "Disaster alert marked as resolved successfully." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTrustedCircle,
  addToCircle,
  removeFromCircle,
  startJourney,
  checkInJourney,
  getActiveJourney,
  getJourneyHistory,
  activateSos,
  resolveSos,
  getRiskZones,
  reportIncident,
  analyzeRoute,
  reportDisaster,
  getActiveDisasters,
  resolveDisaster
};
