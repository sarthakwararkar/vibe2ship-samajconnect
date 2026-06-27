const { db, FieldValue } = require("../config/firebase");

/**
 * POST /api/auth/register — Create user profile in Firestore after Firebase auth.
 */
async function register(req, res, next) {
  try {
    const { name, ward, city, state, lat, lng, languages } = req.body;
    const uid = req.user.uid;
    const email = req.user.email;

    // Check if user already exists (prevent double creation)
    const existingUser = await db.collection("users").doc(uid).get();
    if (existingUser.exists) {
      return res.status(200).json({ message: "User already registered", user: { id: uid, ...existingUser.data() } });
    }

    const userData = {
      uid,
      email,
      name: name || "",
      photoUrl: null,
      ward: ward || "",
      city: city || process.env.DEFAULT_CITY || "Latur",
      state: state || process.env.DEFAULT_STATE || "Maharashtra",
      lat: lat || parseFloat(process.env.DEFAULT_LAT) || 18.4088,
      lng: lng || parseFloat(process.env.DEFAULT_LNG) || 76.5604,
      trustScore: 0,
      tier: "Bronze",
      badges: [],
      isExpert: false,
      expertCategories: [],
      languages: languages || ["Hindi", "English"],
      isDoctor: false,
      isSurgeMode: false,
      specialization: null,
      clinicName: null,
      aqiConsultCount: 0,
      avgResponseMinutes: null,
      consultationFee: null,
      offersVideo: false,
      offersWalkIn: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await db.collection("users").doc(uid).set(userData);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: uid, ...userData }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/profile — Update user profile.
 */
async function updateProfile(req, res, next) {
  try {
    const uid = req.user.uid;
    const { name, ward, city, state, lat, lng, languages, photoUrl } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (ward !== undefined) updates.ward = ward;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (languages !== undefined) updates.languages = languages;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    updates.updatedAt = FieldValue.serverTimestamp();

    await db.collection("users").doc(uid).update(updates);

    const updatedSnap = await db.collection("users").doc(uid).get();
    res.json({ message: "Profile updated", user: { id: uid, ...updatedSnap.data() } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/profile/:uid — Get any user's public profile.
 */
async function getProfile(req, res, next) {
  try {
    const { uid } = req.params;
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
    }

    const user = userSnap.data();
    // Return public profile (exclude sensitive fields)
    res.json({
      id: uid,
      name: user.name,
      photoUrl: user.photoUrl,
      ward: user.ward,
      city: user.city,
      state: user.state,
      trustScore: user.trustScore,
      tier: user.tier,
      badges: user.badges,
      isExpert: user.isExpert,
      expertCategories: user.expertCategories,
      isDoctor: user.isDoctor,
      specialization: user.specialization,
      clinicName: user.clinicName,
      createdAt: user.createdAt
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me — Get authenticated user's full profile.
 */
async function getMe(req, res, next) {
  try {
    const uid = req.user.uid;
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found. Please register first.", code: "NOT_REGISTERED" });
    }

    res.json({ id: uid, ...userSnap.data() });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/expert-register — Register as an expert.
 */
async function registerExpert(req, res, next) {
  try {
    const uid = req.user.uid;
    const { expertCategories } = req.body;

    if (!expertCategories || !Array.isArray(expertCategories) || expertCategories.length === 0) {
      return res.status(400).json({ error: "Please provide at least one expert category", code: "INVALID_CATEGORIES" });
    }

    const validCategories = ["agriculture", "legal", "medical", "plumbing", "electrical", "education", "financial", "technology"];
    const invalid = expertCategories.filter(c => !validCategories.includes(c));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Invalid categories: ${invalid.join(", ")}`, code: "INVALID_CATEGORIES" });
    }

    await db.collection("users").doc(uid).update({
      isExpert: true,
      expertCategories,
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ message: "Registered as expert successfully", expertCategories });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/doctor-register — Register as a doctor.
 */
async function registerDoctor(req, res, next) {
  try {
    const uid = req.user.uid;
    const {
      specialization, clinicName, address, phone,
      consultationFee, offersVideo, offersWalkIn,
      availableFrom, availableTo, availableDays
    } = req.body;

    if (!specialization) {
      return res.status(400).json({ error: "Specialization is required", code: "MISSING_SPECIALIZATION" });
    }

    // Update user profile
    await db.collection("users").doc(uid).update({
      isDoctor: true,
      specialization,
      clinicName: clinicName || null,
      consultationFee: consultationFee || null,
      offersVideo: offersVideo || false,
      offersWalkIn: offersWalkIn || false,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Create doctor listing
    const userSnap = await db.collection("users").doc(uid).get();
    const user = userSnap.data();

    const doctorData = {
      uid,
      name: user.name,
      specialization,
      relevantPollutants: getRelevantPollutants(specialization),
      clinicName: clinicName || null,
      address: address || "",
      lat: user.lat,
      lng: user.lng,
      phone: phone || null,
      email: user.email,
      isSurgeMode: false,
      isAvailable: true,
      availableFrom: availableFrom || "09:00",
      availableTo: availableTo || "21:00",
      availableDays: availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      avgResponseMinutes: null,
      rating: 0,
      reviewCount: 0,
      aqiConsultCount: 0,
      consultationFee: consultationFee || null,
      offersVideo: offersVideo || false,
      offersWalkIn: offersWalkIn || true,
      isVerified: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await db.collection("doctors").add(doctorData);

    res.status(201).json({ message: "Registered as doctor successfully", doctor: doctorData });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper: Get relevant pollutants based on medical specialization.
 */
function getRelevantPollutants(specialization) {
  const mapping = {
    "Pulmonologist": ["pm25", "pm10", "o3"],
    "Cardiologist": ["pm25", "co", "no2"],
    "Pediatrician": ["pm25", "pm10", "o3", "no2"],
    "ENT Specialist": ["pm25", "pm10", "so2"],
    "General Physician": ["pm25", "pm10", "o3", "no2", "so2", "co"],
    "Allergist": ["pm25", "pm10", "o3"],
    "Dermatologist": ["pm25", "so2"]
  };
  return mapping[specialization] || ["pm25", "pm10"];
}

/**
 * PATCH /api/auth/surge-mode — Toggle surge mode (doctors only).
 */
async function toggleSurgeMode(req, res, next) {
  try {
    const uid = req.user.uid;
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists || !userSnap.data().isDoctor) {
      return res.status(403).json({ error: "Only registered doctors can toggle surge mode", code: "NOT_DOCTOR" });
    }

    const currentMode = userSnap.data().isSurgeMode;
    const newMode = !currentMode;

    // Update user profile
    await db.collection("users").doc(uid).update({
      isSurgeMode: newMode,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update doctor listing
    const doctorSnap = await db.collection("doctors").where("uid", "==", uid).limit(1).get();
    if (!doctorSnap.empty) {
      await doctorSnap.docs[0].ref.update({
        isSurgeMode: newMode,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // Award trust points if enabling surge mode
    if (newMode) {
      const trustService = require("../services/trust.service");
      await trustService.addPoints(uid, "doctor_surge_mode");
    }

    res.json({ message: `Surge mode ${newMode ? "enabled" : "disabled"}`, isSurgeMode: newMode });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/notifications — Get user's notifications.
 */
async function getNotifications(req, res, next) {
  try {
    const uid = req.user.uid;
    const { limit = 20, unreadOnly } = req.query;

    let query = db.collection("notifications")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit));

    if (unreadOnly === "true") {
      query = db.collection("notifications")
        .where("userId", "==", uid)
        .where("isRead", "==", false)
        .orderBy("createdAt", "desc")
        .limit(parseInt(limit));
    }

    const snap = await query.get();
    const notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ notifications, count: notifications.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/notifications/read-all — Mark all notifications as read.
 */
async function markAllNotificationsRead(req, res, next) {
  try {
    const uid = req.user.uid;
    const unreadSnap = await db.collection("notifications")
      .where("userId", "==", uid)
      .where("isRead", "==", false)
      .get();

    const batch = db.batch();
    unreadSnap.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();

    res.json({ message: "All notifications marked as read", count: unreadSnap.size });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  updateProfile,
  getProfile,
  getMe,
  registerExpert,
  registerDoctor,
  toggleSurgeMode,
  getNotifications,
  markAllNotificationsRead
};
