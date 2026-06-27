const { db, FieldValue } = require("../config/firebase");
const aqiService = require("../services/aqi.service");
const geminiService = require("../services/gemini.service");
const trustService = require("../services/trust.service");
const { haversineDistance, getBoundingBox } = require("../services/firestore.service");
const axios = require("axios");

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "SamajConnectCivicApp/1.0 (contact: support@samajconnect.org)"
      }
    });
    if (res.data && res.data.address) {
      const addr = res.data.address;
      return addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "Latur";
    }
  } catch (err) {
    console.warn("Nominatim reverse geocoding failed:", err.message);
  }
  return null;
}

/**
 * GET /api/aqi/current — Fetch live AQI for lat/lng.
 */
async function getCurrentAqi(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat) || parseFloat(process.env.DEFAULT_LAT) || 18.4088;
    const lng = parseFloat(req.query.lng) || parseFloat(process.env.DEFAULT_LNG) || 76.5604;

    // Fetch AQI and weather in parallel
    const [aqiData, weatherData] = await Promise.all([
      aqiService.fetchWaqiAqi(lat, lng),
      aqiService.fetchWeather(lat, lng)
    ]);

    const alertLevel = aqiService.getAlertLevel(aqiData.aqi);
    const currentHour = new Date().getHours();
    const predictedAqi = aqiService.predictAqi(aqiData.aqi, currentHour);
    const spikeExpected = predictedAqi > 150 && aqiData.aqi <= 150;

    // Save reading to Firestore for history
    let detectedCity = weatherData.cityName || req.query.city || process.env.DEFAULT_CITY || "Latur";

    // Geocoding Fallback: If weather API returns Latur fallback but coordinates are elsewhere
    if (detectedCity === "Latur" && (Math.abs(lat - 18.4088) > 0.01 || Math.abs(lng - 76.5604) > 0.01)) {
      const resolved = await reverseGeocode(lat, lng);
      if (resolved) {
        detectedCity = resolved;
      }
    }

    const correctedStationName = (detectedCity && detectedCity !== "Latur" && aqiData.stationName === "Latur Shivaji Nagar, India")
      ? `${detectedCity} Central monitoring station, India`
      : aqiData.stationName;

    await db.collection("aqi_readings").add({
      source: "waqi",
      stationId: correctedStationName || "latur",
      lat, lng,
      ward: req.query.ward || "",
      city: detectedCity,
      aqi: aqiData.aqi,
      dominantPollutant: aqiData.dominantPollutant,
      pm25: aqiData.pm25,
      pm10: aqiData.pm10,
      o3: aqiData.o3,
      no2: aqiData.no2,
      so2: null,
      co: null,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      predictedAqi,
      spikeExpected,
      spikeTime: spikeExpected ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null,
      alertLevel,
      recordedAt: FieldValue.serverTimestamp()
    });

    res.json({
      aqi: aqiData.aqi,
      dominantPollutant: aqiData.dominantPollutant,
      pm25: aqiData.pm25,
      pm10: aqiData.pm10,
      o3: aqiData.o3,
      no2: aqiData.no2,
      temperature: weatherData.temperature,
      feelsLike: weatherData.feelsLike,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      weatherDescription: weatherData.description,
      alertLevel,
      predictedAqi,
      spikeExpected,
      spikeTime: spikeExpected ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null,
      stationName: correctedStationName,
      city: detectedCity
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/aqi/forecast — Get AQI prediction + AI explanation.
 */
async function getAqiForecast(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat) || parseFloat(process.env.DEFAULT_LAT) || 18.4088;
    const lng = parseFloat(req.query.lng) || parseFloat(process.env.DEFAULT_LNG) || 76.5604;

    const [aqiData, weatherData] = await Promise.all([
      aqiService.fetchWaqiAqi(lat, lng),
      aqiService.fetchWeather(lat, lng)
    ]);

    const currentHour = new Date().getHours();
    const predictedAqi = aqiService.predictAqi(aqiData.aqi, currentHour);

    // Get AI explanation for the spike
    let explanation = null;
    if (predictedAqi > aqiData.aqi) {
      try {
        explanation = await geminiService.explainAqiSpike(
          aqiData.aqi, predictedAqi,
          aqiData.dominantPollutant,
          weatherData
        );
      } catch (err) {
        console.warn("AQI spike explanation failed:", err.message);
      }
    }

    res.json({
      currentAqi: aqiData.aqi,
      predictedAqi,
      spikeExpected: predictedAqi > 150 && aqiData.aqi <= 150,
      dominantPollutant: aqiData.dominantPollutant,
      weather: weatherData,
      explanation
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/aqi/health-advice — Get AI health advice for symptoms + AQI.
 */
async function getHealthAdvice(req, res, next) {
  try {
    const { aqi, pollutant, symptoms = [] } = req.body;

    if (!aqi || !pollutant) {
      return res.status(400).json({ error: "aqi and pollutant are required", code: "MISSING_FIELDS" });
    }

    // Call both AI functions in parallel
    const [healthAdvice, specialistMatch] = await Promise.all([
      geminiService.generateAqiHealthAdvice(aqi, pollutant, symptoms),
      symptoms.length > 0
        ? geminiService.matchSymptomsToSpecialist(symptoms, pollutant, aqi)
        : Promise.resolve(null)
    ]);

    res.json({
      healthAdvice,
      specialistMatch,
      aqi,
      pollutant
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/aqi/doctors — Get available doctors for current AQI.
 */
async function getDoctors(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat) || parseFloat(process.env.DEFAULT_LAT) || 18.4088;
    const lng = parseFloat(req.query.lng) || parseFloat(process.env.DEFAULT_LNG) || 76.5604;
    const pollutant = req.query.pollutant || "pm25";
    const radius = parseInt(req.query.radius) || 5000;

    // Get all doctors
    const doctorsSnap = await db.collection("doctors").get();
    let doctors = doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter: relevant to pollutant OR available
    doctors = doctors.filter(d =>
      (d.relevantPollutants && d.relevantPollutants.includes(pollutant)) || d.isAvailable
    );

    // Calculate distance and filter by radius
    doctors = doctors
      .map(d => {
        const distance = haversineDistance(lat, lng, d.lat || lat, d.lng || lng);
        return { ...d, distance: Math.round(distance), distanceKm: parseFloat((distance / 1000).toFixed(1)) };
      })
      .filter(d => d.distance <= radius);

    // Sort: surge mode first, then by distance, then by rating
    doctors.sort((a, b) => {
      if (a.isSurgeMode !== b.isSurgeMode) return b.isSurgeMode ? 1 : -1;
      if (a.distance !== b.distance) return a.distance - b.distance;
      return (b.rating || 0) - (a.rating || 0);
    });

    // Return top 6
    doctors = doctors.slice(0, 6);

    res.json({ doctors, count: doctors.length, pollutant });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/aqi/doctors/:id/surge — Toggle doctor surge mode.
 */
async function toggleDoctorSurge(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const doctorSnap = await db.collection("doctors").doc(id).get();
    if (!doctorSnap.exists) {
      return res.status(404).json({ error: "Doctor not found", code: "DOCTOR_NOT_FOUND" });
    }

    const doctor = doctorSnap.data();
    if (doctor.uid !== uid) {
      return res.status(403).json({ error: "You can only toggle your own surge mode", code: "UNAUTHORIZED" });
    }

    const newMode = !doctor.isSurgeMode;
    await db.collection("doctors").doc(id).update({
      isSurgeMode: newMode,
      updatedAt: FieldValue.serverTimestamp()
    });

    if (newMode) {
      await trustService.addPoints(uid, "doctor_surge_mode", id, "doctor");
    }

    res.json({ message: `Surge mode ${newMode ? "enabled" : "disabled"}`, isSurgeMode: newMode });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/aqi/history — Get AQI readings history for last 7 days.
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
      .orderBy("recordedAt", "desc")
      .limit(100)
      .get();

    const readings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ readings, count: readings.length, city, days });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/aqi/sensor-reading — Submit community sensor reading.
 */
async function submitSensorReading(req, res, next) {
  try {
    const userId = req.user.uid;
    const { aqi, pm25, pm10, lat, lng, ward, city } = req.body;

    if (!aqi) {
      return res.status(400).json({ error: "aqi value is required", code: "MISSING_AQI" });
    }

    const readingData = {
      source: "community_sensor",
      stationId: `user_${userId}`,
      lat: lat || parseFloat(process.env.DEFAULT_LAT),
      lng: lng || parseFloat(process.env.DEFAULT_LNG),
      ward: ward || "",
      city: city || process.env.DEFAULT_CITY || "Latur",
      aqi,
      dominantPollutant: pm25 > (pm10 || 0) ? "pm25" : "pm10",
      pm25: pm25 || null,
      pm10: pm10 || null,
      o3: null, no2: null, so2: null, co: null,
      temperature: null,
      humidity: null,
      windSpeed: null,
      predictedAqi: null,
      spikeExpected: false,
      spikeTime: null,
      alertLevel: aqiService.getAlertLevel(aqi),
      recordedAt: FieldValue.serverTimestamp()
    };

    await db.collection("aqi_readings").add(readingData);

    // Award +2 trust points
    await trustService.addPoints(userId, "aqi_data_contributed");

    res.status(201).json({
      message: "Sensor reading submitted",
      alertLevel: readingData.alertLevel,
      pointsAwarded: 2
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/aqi/alert-zones — Get zones currently under AQI alert.
 */
async function getAlertZones(req, res, next) {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Latur";

    // Get recent readings with alerts
    const snap = await db.collection("aqi_readings")
      .where("city", "==", city)
      .where("alertLevel", "in", ["unhealthy", "very_unhealthy", "hazardous"])
      .orderBy("recordedAt", "desc")
      .limit(20)
      .get();

    const alertZones = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lat: data.lat,
        lng: data.lng,
        ward: data.ward,
        aqi: data.aqi,
        alertLevel: data.alertLevel,
        dominantPollutant: data.dominantPollutant,
        recordedAt: data.recordedAt
      };
    });

    res.json({ alertZones, count: alertZones.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCurrentAqi,
  getAqiForecast,
  getHealthAdvice,
  getDoctors,
  toggleDoctorSurge,
  getAqiHistory,
  submitSensorReading,
  getAlertZones
};
