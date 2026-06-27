# SamajConnect — Backend Build Prompt (Desktop Website)
> Feed this entire file to your AI coding assistant (Antigravity, Cursor, Copilot, etc.)
> This is the complete backend spec for the SamajConnect desktop web platform.
> Stack: Node.js + Express + Firebase Admin SDK + Gemini API (free tier)
> Target: Desktop web application — no mobile-specific logic needed

---

## PROJECT OVERVIEW

Build the complete backend for **SamajConnect** — a community super-app for Indian citizens, designed as a full desktop web platform.

### Six core modules:
1. **Infrastructure reporting** — potholes, water leaks, broken lights, waste overflow
2. **AQI + weather alerts** — hyperlocal air quality, spike prediction, health advisories
3. **Women's safety network** — trusted circle, journey tracking, SOS escalation
4. **Doctor + consultant listings** — contextual listings triggered by high AQI
5. **Expertise sharing hub** — neighborhood Q&A with AI routing
6. **Items + books marketplace** — sell, donate, borrow with AI pricing

### One shared spine:
- **Trust Score system** — gamification engine across all modules
- **User identity** — phone/email verified profiles, ward-based grouping
- **Impact dashboard** — community-wide stats and analytics

---

## TECH STACK (ALL FREE)

```
Runtime:         Node.js v18+
Framework:       Express.js
Database:        Firebase Firestore (free tier)
Auth:            Firebase Authentication (Email/Password + Google OAuth)
File Storage:    Firebase Storage (5GB free)
AI:              Google Gemini API — gemini-1.5-flash model (free tier)
External APIs:   WAQI (air quality), OpenWeatherMap (weather)
Environment:     .env file for all secrets
Deployment:      Firebase Hosting (free) or localhost for dev
```

> Note: No SMS/phone OTP needed — desktop users authenticate via Email + Password or Google OAuth. Much simpler than mobile auth.

---

## PROJECT STRUCTURE

Generate this exact folder structure:

```
samajconnect-backend/
├── src/
│   ├── config/
│   │   ├── firebase.js            # Firebase Admin SDK init
│   │   └── gemini.js              # Gemini API client init
│   ├── middleware/
│   │   ├── auth.js                # Verify Firebase ID token from Authorization header
│   │   ├── errorHandler.js        # Global error handler
│   │   ├── rateLimiter.js         # Rate limiting for AI endpoints
│   │   └── validate.js            # express-validator request validation
│   ├── routes/
│   │   ├── auth.routes.js         # User registration, login, profile
│   │   ├── issues.routes.js       # Infrastructure reporting
│   │   ├── aqi.routes.js          # AQI + weather + doctor listings
│   │   ├── safety.routes.js       # Safety network + SOS + journeys
│   │   ├── hub.routes.js          # Expertise Q&A
│   │   ├── marketplace.routes.js  # Items + books listings
│   │   ├── trust.routes.js        # Trust Score + leaderboard
│   │   └── dashboard.routes.js    # Impact dashboard aggregations
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── issues.controller.js
│   │   ├── aqi.controller.js
│   │   ├── safety.controller.js
│   │   ├── hub.controller.js
│   │   ├── marketplace.controller.js
│   │   ├── trust.controller.js
│   │   └── dashboard.controller.js
│   ├── services/
│   │   ├── gemini.service.js      # All Gemini API calls — single source of truth
│   │   ├── firestore.service.js   # Reusable Firestore CRUD helpers
│   │   ├── aqi.service.js         # WAQI + OpenWeather API integration
│   │   ├── trust.service.js       # Trust Score calculation + tier logic
│   │   └── storage.service.js     # Firebase Storage upload helpers
│   └── app.js                     # Express app setup, middleware, route mounting
├── seed/
│   └── seedData.js                # Populate Firestore with realistic demo data
├── .env.example
├── .gitignore
├── package.json
└── server.js                      # Entry point
```

---

## ENVIRONMENT VARIABLES

Create `.env.example` with these variables:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK
# Download serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Gemini API — get free key at aistudio.google.com
GEMINI_API_KEY=your-gemini-api-key

# WAQI (World Air Quality Index) — free token at aqicn.org/data-platform/token/
WAQI_TOKEN=your-waqi-token

# OpenWeatherMap — free key at openweathermap.org (1000 calls/day free)
OPENWEATHER_API_KEY=your-openweather-key

# Default city coordinates (Latur, Maharashtra)
DEFAULT_LAT=18.4088
DEFAULT_LNG=76.5604
DEFAULT_CITY=Latur
DEFAULT_STATE=Maharashtra
```

---

## FIRESTORE DATABASE SCHEMA

### Collection: `users`
```javascript
{
  uid: "firebase_uid",
  email: "user@example.com",
  name: "Sarthak Kulkarni",
  photoUrl: null,
  ward: "Ward 12",
  city: "Latur",
  state: "Maharashtra",
  lat: 18.4088,
  lng: 76.5604,
  trustScore: 0,
  tier: "Bronze",               // Bronze | Silver | Gold | Platinum
  badges: [],                   // array of badge keys
  isExpert: false,
  expertCategories: [],         // ["agriculture", "legal", "medical", "plumbing", "electrical"]
  languages: ["Marathi", "Hindi", "English"],
  isDoctor: false,
  isSurgeMode: false,           // doctors toggle this during AQI spikes
  specialization: null,         // for doctors: "Pulmonologist" etc.
  clinicName: null,
  aqiConsultCount: 0,
  avgResponseMinutes: null,
  consultationFee: null,
  offersVideo: false,
  offersWalkIn: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `issues`
```javascript
{
  id: "auto_generated",
  reporterId: "uid",
  reporterName: "Sarthak",
  reporterTier: "Silver",
  category: "pothole",          // pothole | water_leak | streetlight | waste | road_damage | other
  severity: "high",             // low | medium | high | critical
  description: "Large pothole near HDFC Bank",
  photoUrl: "https://storage.firebase.../photo.jpg",
  videoUrl: null,
  lat: 18.4088,
  lng: 76.5604,
  address: "MG Road, near HDFC Bank, Latur",
  ward: "Ward 12",
  city: "Latur",
  status: "open",               // open | verified | assigned | in_progress | resolved | rejected
  upvotes: 0,
  upvotedBy: [],                // array of UIDs
  verifiedBy: [],               // array of UIDs who verified
  verificationCount: 0,
  assignedDepartment: null,     // PWD | water_board | electricity | sanitation | municipal
  aiCategory: "pothole",
  aiSeverity: "high",
  aiConfidence: 0.92,
  aiDepartment: "PWD",
  isDuplicate: false,
  duplicateOf: null,            // issue ID if duplicate
  resolvedAt: null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `aqi_readings`
```javascript
{
  id: "auto_generated",
  source: "waqi",               // waqi | openweather | community_sensor
  stationId: "latur",
  lat: 18.4088,
  lng: 76.5604,
  ward: "Ward 12",
  city: "Latur",
  aqi: 142,
  dominantPollutant: "pm25",    // pm25 | pm10 | o3 | no2 | so2 | co
  pm25: 68.3,
  pm10: 82.1,
  o3: null,
  no2: null,
  so2: null,
  co: null,
  temperature: 34,
  humidity: 65,
  windSpeed: 12,
  predictedAqi: 178,
  spikeExpected: true,
  spikeTime: "2026-06-24T20:30:00Z",
  alertLevel: "unhealthy",      // good | moderate | sensitive | unhealthy | very_unhealthy | hazardous
  recordedAt: Timestamp
}
```

### Collection: `doctors`
```javascript
{
  id: "auto_generated",
  uid: null,                    // Firebase UID if registered on platform
  name: "Dr. Rajesh Kulkarni",
  specialization: "Pulmonologist",
  relevantPollutants: ["pm25", "pm10"],
  clinicName: "Latur City Clinic",
  address: "MG Road, Latur",
  lat: 18.4090,
  lng: 76.5610,
  phone: "+919876543210",
  email: "dr.rajesh@example.com",
  isSurgeMode: false,
  isAvailable: true,
  availableFrom: "09:00",
  availableTo: "21:00",
  availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat"],
  avgResponseMinutes: 8,
  rating: 4.8,
  reviewCount: 34,
  aqiConsultCount: 34,
  consultationFee: 300,
  offersVideo: true,
  offersWalkIn: true,
  isVerified: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `journeys`
```javascript
{
  id: "auto_generated",
  userId: "uid",
  userName: "Priya",
  fromAddress: "Home, Sector 5, Latur",
  toAddress: "Latur Bus Stand",
  fromLat: 18.4088,
  fromLng: 76.5604,
  toLat: 18.4120,
  toLng: 76.5650,
  expectedArrival: Timestamp,
  status: "active",             // active | completed | missed | sos
  trustedCircle: ["uid1", "uid2"],
  riskZonesOnRoute: [],
  aiRiskLevel: "medium",
  aiRiskAdvice: "...",
  checkedInAt: null,
  sosActivatedAt: null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `trusted_circles`
```javascript
{
  id: "uid",                    // document ID = user UID
  userId: "uid",
  contacts: [
    {
      contactUid: "uid2",
      name: "Mom (Anita)",
      phone: "+919876543211",
      email: "anita@example.com",
      isOnApp: true,
      addedAt: Timestamp
    }
  ],
  updatedAt: Timestamp
}
```

### Collection: `sos_events`
```javascript
{
  id: "auto_generated",
  userId: "uid",
  userName: "Priya",
  lat: 18.4100,
  lng: 76.5620,
  address: "Station Road, Latur",
  trustedCircleNotified: ["uid1", "uid2"],
  status: "active",             // active | resolved
  resolvedAt: null,
  createdAt: Timestamp
}
```

### Collection: `questions`
```javascript
{
  id: "auto_generated",
  askerId: "uid",
  askerName: "Ramesh",
  askerTier: "Bronze",
  title: "What is wrong with my tomato plant?",
  body: "Leaves are turning yellow from the edges since last week",
  photoUrl: null,
  category: "agriculture",      // agriculture | legal | medical | plumbing | electrical | education | financial | other
  aiCategory: "agriculture",
  aiRoutedTo: "agriculture_expert",
  aiTags: ["crop disease", "tomato", "leaf problem"],
  language: "English",
  ward: "Ward 12",
  city: "Latur",
  status: "open",               // open | answered | solved
  answerCount: 0,
  upvotes: 0,
  upvotedBy: [],
  isFeatured: false,
  viewCount: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Subcollection: `questions/{questionId}/answers`
```javascript
{
  id: "auto_generated",
  expertId: "uid",
  expertName: "Suresh Patil",
  expertTier: "Gold",
  expertCategory: "agriculture",
  body: "This looks like early blight caused by Alternaria solani...",
  photoUrl: null,
  upvotes: 0,
  upvotedBy: [],
  isAccepted: false,
  createdAt: Timestamp
}
```

### Collection: `listings`
```javascript
{
  id: "auto_generated",
  sellerId: "uid",
  sellerName: "Anita",
  sellerTier: "Silver",
  sellerTrustScore: 780,
  title: "NCERT Class 10 Science Book",
  description: "Good condition, no highlighting or writing",
  category: "books",            // books | electronics | furniture | clothing | appliances | tools | sports | other
  listingType: "sell",          // sell | donate | borrow
  price: 80,                    // 0 for donate
  aiSuggestedPriceMin: 60,
  aiSuggestedPriceMax: 120,
  condition: "good",            // like_new | good | fair | needs_repair
  aiCondition: "good",
  aiConditionNotes: "Light use, minor wear on cover",
  photoUrls: ["https://..."],
  lat: 18.4088,
  lng: 76.5604,
  ward: "Ward 12",
  city: "Latur",
  status: "active",             // active | claimed | sold | borrowed | expired
  listingTypeDetails: {
    borrowDurationDays: null,
    depositAmount: null,
    donationPreference: null    // anyone | students | families | seniors
  },
  claimedBy: null,
  viewCount: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `needs`
```javascript
{
  id: "auto_generated",
  userId: "uid",
  userName: "Rahul",
  title: "Looking for a pressure cooker to borrow for 3 days",
  category: "appliances",
  needType: "borrow",           // buy | borrow | donate_request
  ward: "Ward 12",
  city: "Latur",
  status: "open",               // open | fulfilled
  responseCount: 0,
  createdAt: Timestamp
}
```

### Collection: `trust_events`
```javascript
{
  id: "auto_generated",
  userId: "uid",
  event: "issue_reported",
  points: 50,
  referenceId: "issue_id",
  referenceType: "issue",       // issue | question | answer | listing | journey | sos
  description: "Reported pothole on MG Road",
  createdAt: Timestamp
}
```

### Collection: `risk_zones`
```javascript
{
  id: "auto_generated",
  lat: 18.4100,
  lng: 76.5620,
  radiusMeters: 200,
  address: "Station Road, Latur",
  ward: "Ward 12",
  city: "Latur",
  incidentCount: 3,
  highRiskTimeSlots: ["21:00-23:00", "06:00-07:00"],
  lastIncident: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `notifications`
```javascript
{
  id: "auto_generated",
  userId: "uid",
  type: "issue_resolved",       // issue_resolved | aqi_alert | sos_alert | answer_received | journey_missed | points_earned
  title: "Issue Resolved!",
  body: "Your pothole report on MG Road has been resolved.",
  referenceId: "issue_id",
  isRead: false,
  createdAt: Timestamp
}
```

---

## `src/config/firebase.js`

```javascript
const admin = require("firebase-admin");

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const { FieldValue, Timestamp } = admin.firestore;

module.exports = { admin, db, auth, storage, FieldValue, Timestamp };
```

---

## `src/config/gemini.js`

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Primary model — free tier
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Vision model — same model handles images too
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = { genAI, model, visionModel };
```

---

## GEMINI SERVICE — `src/services/gemini.service.js`

This is the most critical file. Implement ALL 12 functions completely.

### Implementation Pattern — follow for every function:
```javascript
const { model, visionModel } = require("../config/gemini");

// Strip markdown fences, parse JSON safely
function parseGeminiJSON(text) {
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini JSON parse failed: ${text.slice(0, 100)}`);
  }
}

// Base caller — text only
async function callGemini(prompt) {
  const result = await model.generateContent(prompt);
  return parseGeminiJSON(result.response.text());
}

// Vision caller — text + image
async function callGeminiVision(prompt, imageBase64, mimeType = "image/jpeg") {
  const result = await visionModel.generateContent([
    { text: prompt },
    { inlineData: { mimeType, data: imageBase64 } }
  ]);
  return parseGeminiJSON(result.response.text());
}
```

### The 12 Gemini Functions:

**1. `classifyIssue(description, imageBase64 = null)`**
```
Prompt: You are an AI for a civic issue reporting platform in India.
Analyze this infrastructure issue and respond ONLY in valid JSON with no markdown.
Description: "${description}"
Return: { "category": "pothole|water_leak|streetlight|waste|road_damage|other", "severity": "low|medium|high|critical", "department": "PWD|water_board|electricity|sanitation|municipal|other", "confidence": 0.0-1.0, "reason": "brief explanation in one sentence" }
```
If imageBase64 provided, use callGeminiVision. Otherwise use callGemini.
Fallback on error: `{ category: "other", severity: "medium", department: "municipal", confidence: 0.5, reason: "Manual review needed" }`

**2. `checkDuplicateIssue(newDescription, newLat, newLng, existingIssues[])`**
```
Prompt: You are checking if a new civic issue report is a duplicate of existing reports.
New report: "${newDescription}" at coordinates (${newLat}, ${newLng})
Existing reports in the area: ${JSON.stringify(existingIssues.map(i => ({ id: i.id, description: i.description, category: i.category })))}
Return ONLY valid JSON: { "isDuplicate": true|false, "similarIssueId": "issue_id_or_null", "confidence": 0.0-1.0 }
```
Fallback: `{ isDuplicate: false, similarIssueId: null, confidence: 0 }`

**3. `generateAqiHealthAdvice(aqi, dominantPollutant, symptoms = [])`**
```
Prompt: You are a public health AI assistant for an Indian community app.
Current AQI: ${aqi}, Dominant pollutant: ${dominantPollutant}
User symptoms: ${symptoms.length ? symptoms.join(", ") : "none reported"}
Provide health advice for this air quality situation.
Return ONLY valid JSON: { "riskLevel": "low|moderate|high|severe", "immediateAdvice": "what to do right now in one sentence", "specialistType": "General Physician|Pulmonologist|Cardiologist|Pediatrician|ENT|none", "urgency": "routine|soon|urgent|emergency", "tips": ["tip1", "tip2", "tip3"], "schoolAdvice": "advice for schools/offices in one sentence" }
```

**4. `matchSymptomsToSpecialist(symptoms[], pollutant, aqiLevel)`**
```
Prompt: Match these symptoms to the most appropriate medical specialist type.
Symptoms: ${symptoms.join(", ")}
Air pollutant context: ${pollutant}, AQI level: ${aqiLevel}
Return ONLY valid JSON: { "specialistType": "specialist name", "urgency": "routine|soon|urgent|emergency", "reasoning": "one sentence", "doNotDelay": true|false }
```

**5. `categorizeQuestion(title, body, photoDescription = null)`**
```
Prompt: You are routing community questions to the right expert in an Indian town.
Question title: "${title}"
Question body: "${body}"
${photoDescription ? `Photo description: "${photoDescription}"` : ""}
Return ONLY valid JSON: { "category": "agriculture|legal|medical|plumbing|electrical|education|financial|other", "suggestedExpertType": "descriptive expert role", "tags": ["tag1","tag2","tag3"], "priority": "low|medium|high", "language": "detected language" }
```

**6. `findSimilarQuestions(newQuestion, existingQuestions[])`**
```
Prompt: Find if any existing Q&A answers this new question.
New question: "${newQuestion}"
Existing questions: ${JSON.stringify(existingQuestions.map(q => ({ id: q.id, title: q.title, status: q.status })))}
Return ONLY valid JSON: { "hasSimilar": true|false, "similarIds": ["id1", "id2"], "confidence": 0.0-1.0 }
```
Fallback: `{ hasSimilar: false, similarIds: [], confidence: 0 }`

**7. `suggestItemPrice(itemName, condition, category, description = "")`**
```
Prompt: You are helping price second-hand items for a community marketplace in a tier-2 Indian city (Latur, Maharashtra).
Item: "${itemName}", Category: "${category}", Condition: "${condition}"
Description: "${description}"
Consider typical prices in small Indian cities, not metro prices.
Return ONLY valid JSON: { "minPrice": number, "maxPrice": number, "suggestedPrice": number, "reasoning": "one sentence", "currency": "INR" }
```

**8. `assessItemCondition(description, photoDescription = null)`**
```
Prompt: Assess the condition of a second-hand item based on its description.
Description: "${description}"
${photoDescription ? `Visual description: "${photoDescription}"` : ""}
Return ONLY valid JSON: { "condition": "like_new|good|fair|needs_repair", "confidence": 0.0-1.0, "notes": "brief notes on condition", "repairSuggestion": "null or brief suggestion if needs_repair" }
```

**9. `analyzeRouteRisk(fromAddress, toAddress, timeOfDay, riskZones[])`**
```
Prompt: Analyze the safety risk of a journey for a women's safety app in India.
From: "${fromAddress}" To: "${toAddress}", Time: "${timeOfDay}"
Known risk zones on or near the route: ${JSON.stringify(riskZones.map(z => ({ address: z.address, incidents: z.incidentCount, timeSlots: z.highRiskTimeSlots })))}
Return ONLY valid JSON: { "overallRisk": "low|medium|high", "riskFactors": ["factor1","factor2"], "advice": "safety advice in one sentence", "suggestAlternate": true|false, "alternateRouteSuggestion": "suggestion or null", "checkInRecommendedMinutes": number }
```
Fallback: `{ overallRisk: "low", riskFactors: [], advice: "Stay aware of your surroundings", suggestAlternate: false, alternateRouteSuggestion: null, checkInRecommendedMinutes: 30 }`

**10. `explainAqiSpike(currentAqi, predictedAqi, pollutant, weather)`**
```
Prompt: Explain an upcoming air quality spike in simple terms for Indian citizens.
Current AQI: ${currentAqi}, Predicted AQI in 2 hours: ${predictedAqi}
Primary pollutant: ${pollutant}, Weather: ${JSON.stringify(weather)}
Return ONLY valid JSON: { "explanation": "plain English explanation in 2 sentences", "cause": "likely cause", "duration": "estimated duration", "affectedGroups": ["group1","group2"], "immediateActions": ["action1","action2","action3"] }
```

**11. `generateIssueSummary(issues[])`**
```
Used for the impact dashboard.
Prompt: Summarize these community issues for a public dashboard.
Issues data: ${JSON.stringify(issues.map(i => ({ category: i.category, status: i.status, severity: i.severity, ward: i.ward })))}
Return ONLY valid JSON: { "totalOpen": number, "criticalCount": number, "topCategory": "category name", "topWard": "ward name", "resolutionRate": "percentage string", "insight": "one interesting community insight sentence" }
```

**12. `moderateContent(text, type)`**
```
Used to check question/listing content for spam or inappropriate material.
Prompt: Moderate this ${type} content for a community platform. Flag spam, hate speech, or inappropriate content.
Content: "${text}"
Return ONLY valid JSON: { "isAppropriate": true|false, "confidence": 0.0-1.0, "reason": "null or brief reason if flagged" }
```
Fallback: `{ isAppropriate: true, confidence: 1.0, reason: null }`

### Rate limiting wrapper for Gemini (free tier = 15 RPM):
```javascript
let lastCallTime = 0;
const MIN_INTERVAL_MS = 4000; // 15 RPM = 1 per 4 seconds

async function rateLimitedCall(fn) {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCallTime);
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  lastCallTime = Date.now();
  return fn();
}
```
Wrap all Gemini calls in `rateLimitedCall(() => callGemini(prompt))`.

---

## AQI SERVICE — `src/services/aqi.service.js`

```javascript
const axios = require("axios");

// Fetch current AQI from WAQI API
async function fetchWaqiAqi(lat, lng) {
  const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${process.env.WAQI_TOKEN}`;
  const res = await axios.get(url);
  if (res.data.status !== "ok") throw new Error("WAQI API error");
  
  const data = res.data.data;
  return {
    aqi: data.aqi,
    dominantPollutant: data.dominantPol,
    pm25: data.iaqi?.pm25?.v || null,
    pm10: data.iaqi?.pm10?.v || null,
    o3: data.iaqi?.o3?.v || null,
    no2: data.iaqi?.no2?.v || null,
    stationName: data.city?.name,
    recordedAt: new Date(data.time?.iso || Date.now())
  };
}

// Fetch weather from OpenWeatherMap
async function fetchWeather(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
  const res = await axios.get(url);
  return {
    temperature: Math.round(res.data.main.temp),
    feelsLike: Math.round(res.data.main.feels_like),
    humidity: res.data.main.humidity,
    windSpeed: res.data.wind.speed,
    description: res.data.weather[0].description,
    icon: res.data.weather[0].icon
  };
}

// Get AQI alert level
function getAlertLevel(aqi) {
  if (aqi <= 50)  return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

// Simple prediction: if current trend is upward, predict spike
// For prototype: use a simple multiplier based on time of day
function predictAqi(currentAqi, hour) {
  const eveningMultiplier = (hour >= 17 && hour <= 21) ? 1.2 : 1.0;
  return Math.round(currentAqi * eveningMultiplier);
}

module.exports = { fetchWaqiAqi, fetchWeather, getAlertLevel, predictAqi };
```

---

## TRUST SCORE SERVICE — `src/services/trust.service.js`

```javascript
const { db, FieldValue } = require("../config/firebase");

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

const TIERS = [
  { name: "Bronze",   min: 0,    max: 300,  color: "#CD7F32" },
  { name: "Silver",   min: 301,  max: 800,  color: "#C0C0C0" },
  { name: "Gold",     min: 801,  max: 2000, color: "#FFD700" },
  { name: "Platinum", min: 2001, max: Infinity, color: "#C084FC" },
];

function getTier(score) {
  return TIERS.find(t => score >= t.min && score <= t.max)?.name || "Bronze";
}

function getNextTier(currentTier) {
  const idx = TIERS.findIndex(t => t.name === currentTier);
  return TIERS[idx + 1] || null;
}

function getPointsToNextTier(score, currentTier) {
  const next = getNextTier(currentTier);
  if (!next) return 0;
  return next.min - score;
}

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

// Add notification to user
async function addNotification(userId, type, title, body, referenceId = null) {
  await db.collection("notifications").add({
    userId, type, title, body, referenceId,
    isRead: false,
    createdAt: FieldValue.serverTimestamp()
  });
}

module.exports = { addPoints, getTier, getNextTier, getPointsToNextTier, addNotification, TRUST_EVENTS, TIERS };
```

---

## MIDDLEWARE

### `src/middleware/auth.js`
```javascript
const { auth } = require("../config/firebase");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided", code: "UNAUTHORIZED" });
  }
  
  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded; // { uid, email, name, ... }
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }
};
```

### `src/middleware/errorHandler.js`
```javascript
module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  
  // Firestore errors
  if (err.code?.startsWith("firestore/")) {
    return res.status(500).json({ error: "Database error", code: err.code });
  }
  
  // Gemini errors
  if (err.message?.includes("Gemini")) {
    return res.status(503).json({ error: "AI service temporarily unavailable", code: "AI_ERROR" });
  }
  
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    code: err.code || "SERVER_ERROR"
  });
};
```

### `src/middleware/rateLimiter.js`
```javascript
const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests", code: "RATE_LIMITED" }
});

// Strict limiter for AI endpoints (protect Gemini free tier)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "AI endpoint rate limited", code: "AI_RATE_LIMITED" }
});

module.exports = { apiLimiter, aiLimiter };
```

---

## API ROUTES — COMPLETE SPECIFICATION

### AUTH ROUTES — `/api/auth`

```
POST   /api/auth/register          — Create user profile in Firestore after Firebase auth
POST   /api/auth/profile           — Update profile (name, ward, city, languages)
GET    /api/auth/profile/:uid      — Get any user's public profile
GET    /api/auth/me                — Get authenticated user's full profile
POST   /api/auth/expert-register   — Register as expert (set isExpert, expertCategories)
POST   /api/auth/doctor-register   — Register as doctor (set isDoctor, specialization, etc.)
PATCH  /api/auth/surge-mode        — Toggle surge mode (doctors only)
GET    /api/auth/notifications     — Get user's notifications
PATCH  /api/auth/notifications/read-all — Mark all notifications as read
```

**POST /api/auth/register — Request body:**
```json
{
  "name": "Sarthak Kulkarni",
  "ward": "Ward 12",
  "city": "Latur",
  "state": "Maharashtra",
  "lat": 18.4088,
  "lng": 76.5604,
  "languages": ["Marathi", "Hindi", "English"]
}
```
Logic: Get UID from `req.user.uid`. Check if user doc already exists in Firestore (prevent double creation). Create with trustScore: 0, tier: "Bronze". Return full profile.

---

### ISSUES ROUTES — `/api/issues`

```
POST   /api/issues                  — Create new issue report (auth required)
GET    /api/issues                  — List issues (public, with filters)
GET    /api/issues/:id              — Get single issue detail (public)
PATCH  /api/issues/:id/upvote       — Upvote/verify an issue (auth required)
PATCH  /api/issues/:id/status       — Update status (auth required, must be reporter or Gold+)
POST   /api/issues/:id/resolve      — Mark as resolved (auth required)
GET    /api/issues/nearby           — Issues within radius of lat/lng (public)
GET    /api/issues/stats            — Issue statistics by ward/city (public)
```

**POST /api/issues — Request body:**
```json
{
  "description": "Large pothole near HDFC Bank, causing accidents",
  "lat": 18.4088,
  "lng": 76.5604,
  "address": "MG Road, near HDFC Bank, Latur",
  "ward": "Ward 12",
  "city": "Latur",
  "photoBase64": "base64_string_optional",
  "photoUrl": "firebase_storage_url_optional"
}
```

**POST /api/issues — Controller logic (complete):**
```javascript
async function createIssue(req, res, next) {
  try {
    const { description, lat, lng, address, ward, city, photoBase64, photoUrl } = req.body;
    const userId = req.user.uid;
    
    // 1. Get user profile
    const userSnap = await db.collection("users").doc(userId).get();
    const user = userSnap.data();
    
    // 2. AI classification (with fallback)
    let aiResult = { category: "other", severity: "medium", department: "municipal", confidence: 0.5, reason: "Manual review" };
    try {
      aiResult = await geminiService.classifyIssue(description, photoBase64 || null);
    } catch (err) {
      console.warn("Gemini classification failed, using defaults:", err.message);
    }
    
    // 3. Check for duplicates in same area (last 7 days, within ~500m)
    const recentIssues = await db.collection("issues")
      .where("city", "==", city)
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
    const issueRef = db.collection("issues").doc();
    await issueRef.set({
      reporterId: userId,
      reporterName: user.name,
      reporterTier: user.tier,
      description,
      lat, lng, address, ward, city,
      photoUrl: photoUrl || null,
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
    await trustService.addNotification(userId, "points_earned", "Issue Reported! +50 pts", `Your ${aiResult.category} report has been submitted successfully.`, issueRef.id);
    
    res.status(201).json({
      id: issueRef.id,
      aiCategory: aiResult.category,
      aiSeverity: aiResult.severity,
      aiDepartment: aiResult.department,
      message: "Issue reported successfully",
      pointsAwarded: 50
    });
  } catch (err) {
    next(err);
  }
}
```

**GET /api/issues — Query params:**
```
?city=Latur&ward=Ward+12&category=pothole&status=open
&lat=18.4088&lng=76.5604&radius=2000
&sortBy=createdAt|upvotes|severity
&order=desc
&limit=20&offset=0
```

Bounding box geo-filter for radius (Firestore doesn't support native geo queries):
```javascript
// Convert radius in meters to degrees (~111km per degree)
const latDelta = radius / 111000;
const lngDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));
// Query: lat >= lat-latDelta AND lat <= lat+latDelta (same for lng)
// Then filter in-memory for actual circle
```

**PATCH /api/issues/:id/upvote — Logic:**
1. Check user hasn't already upvoted (check `upvotedBy` array)
2. Add userId to `upvotedBy`, increment `upvotes` and `verificationCount`
3. Award +10 points to verifier via `trustService.addPoints(userId, "issue_verified")`
4. If `verificationCount >= 3` AND status is "open": set status to "verified"
5. If status changes to verified: notify original reporter
6. Return `{ upvotes, verificationCount, status, pointsAwarded: 10 }`

**POST /api/issues/:id/resolve — Logic:**
1. Get issue, get reporter UID
2. Set `status: "resolved"`, `resolvedAt: serverTimestamp()`
3. Award +25 bonus points to reporter: `trustService.addPoints(reporterId, "issue_resolved_bonus")`
4. Award +5 points to each verifier in `verifiedBy` array: loop `trustService.addPoints(uid, "verifier_resolved")`
5. Notify reporter: "Your issue has been resolved! +25 bonus pts"
6. Return updated issue

---

### AQI ROUTES — `/api/aqi`

```
GET    /api/aqi/current             — Fetch live AQI for lat/lng (public)
GET    /api/aqi/forecast            — Get AQI prediction + explanation (public)
POST   /api/aqi/health-advice       — Get AI health advice for symptoms + AQI (auth required)
GET    /api/aqi/doctors             — Get available doctors for current AQI (public)
PATCH  /api/aqi/doctors/:id/surge   — Toggle doctor surge mode (auth required, doctor only)
GET    /api/aqi/history             — Get AQI readings history for last 7 days (public)
POST   /api/aqi/sensor-reading      — Submit community sensor reading (auth required)
GET    /api/aqi/alert-zones         — Get zones currently under AQI alert (public)
```

**GET /api/aqi/current — Query params:** `?lat=18.4088&lng=76.5604`

Logic:
1. Call `aqiService.fetchWaqiAqi(lat, lng)` and `aqiService.fetchWeather(lat, lng)` in parallel using `Promise.all()`
2. Compute `alertLevel` using `aqiService.getAlertLevel(aqi)`
3. Compute `predictedAqi` using `aqiService.predictAqi(aqi, currentHour)`
4. Set `spikeExpected = predictedAqi > 150 && aqi <= 150`
5. Save reading to Firestore `aqi_readings` collection (for history)
6. Return combined response:
```json
{
  "aqi": 142,
  "dominantPollutant": "pm25",
  "pm25": 68.3,
  "pm10": 82.1,
  "temperature": 34,
  "humidity": 65,
  "windSpeed": 12,
  "alertLevel": "sensitive",
  "predictedAqi": 178,
  "spikeExpected": true,
  "spikeTime": "ISO string",
  "stationName": "Latur"
}
```

**POST /api/aqi/health-advice — Request body:**
```json
{
  "aqi": 178,
  "pollutant": "pm25",
  "symptoms": ["breathlessness", "chest_tightness"],
  "userProfile": { "hasAsthma": false, "isChild": false, "isSenior": false }
}
```
Call `geminiService.generateAqiHealthAdvice(aqi, pollutant, symptoms)` + `geminiService.matchSymptomsToSpecialist(symptoms, pollutant, aqi)`. Return combined result. Apply `aiLimiter` middleware to this route.

**GET /api/aqi/doctors — Query params:** `?lat=18.4088&lng=76.5604&pollutant=pm25&radius=5000`

Logic:
1. Query Firestore `doctors` collection — no filters (get all)
2. Filter in-memory: `relevantPollutants` includes the current pollutant OR `isAvailable: true`
3. Calculate Haversine distance from user's lat/lng to each doctor
4. Filter by radius
5. Sort: `isSurgeMode` DESC, then `distance` ASC, then `rating` DESC
6. Return top 6 with `distance` field added in km

---

### SAFETY ROUTES — `/api/safety`

```
GET    /api/safety/circle                    — Get user's trusted circle (auth required)
POST   /api/safety/circle                    — Add contact to circle (auth required)
DELETE /api/safety/circle/:contactUid        — Remove contact (auth required)
POST   /api/safety/journey/start             — Start a journey (auth required)
PATCH  /api/safety/journey/:id/checkin       — Check in safely (auth required)
GET    /api/safety/journey/active            — Get current active journey (auth required)
GET    /api/safety/journey/history           — Get user's past journeys (auth required)
POST   /api/safety/sos                       — Activate SOS (auth required)
PATCH  /api/safety/sos/:id/resolve           — Resolve SOS (auth required)
GET    /api/safety/risk-zones                — Get risk zones near location (public)
POST   /api/safety/incident                  — Report an incident anonymously (auth required)
POST   /api/safety/route-analysis            — Analyze route safety (auth required)
```

**POST /api/safety/journey/start — Request body:**
```json
{
  "fromAddress": "Home, Sector 5, Latur",
  "toAddress": "Latur Bus Stand",
  "fromLat": 18.4088, "fromLng": 76.5604,
  "toLat": 18.4120, "toLng": 76.5650,
  "expectedArrivalMinutes": 25,
  "notifyContacts": ["uid1", "uid2"]
}
```

Logic:
1. Get risk zones along route (query risk_zones within bounding box of start/end points)
2. Call `geminiService.analyzeRouteRisk(fromAddress, toAddress, currentTime, riskZones)`
3. Create journey doc in Firestore with `expectedArrival = now + expectedArrivalMinutes`
4. Award +5 points for journey start (encourages use)
5. Return journey ID + risk analysis + riskZonesOnRoute

**POST /api/safety/sos — Request body:**
```json
{ "lat": 18.4100, "lng": 76.5620, "address": "Station Road, Latur" }
```

Logic:
1. Create SOS event in Firestore
2. Get user's trusted circle from `trusted_circles` collection
3. Add notification for each trusted contact: `addNotification(contactUid, "sos_alert", "⚠️ SOS Alert", "${userName} has activated SOS at ${address}. Check the app immediately.", sosId)`
4. Find Gold+ users within 1km who have opted in as community guards
5. Update user's active journey status to "sos" if exists
6. Return SOS event ID + list of notified contacts + notified guards count

---

### HUB ROUTES — `/api/hub`

```
POST   /api/hub/questions              — Post a question (auth required)
GET    /api/hub/questions              — List questions (public, with filters)
GET    /api/hub/questions/:id          — Get question + all answers (public)
POST   /api/hub/questions/:id/answers  — Post an answer (auth required, isExpert preferred)
PATCH  /api/hub/questions/:id/answers/:answerId/accept — Accept answer (auth, asker only)
PATCH  /api/hub/questions/:id/upvote   — Upvote question (auth required)
PATCH  /api/hub/answers/:answerId/upvote — Upvote an answer (auth required)
GET    /api/hub/questions/search       — Search questions (public)
GET    /api/hub/experts                — List experts (public, filter by category)
GET    /api/hub/categories             — Get all categories with question counts (public)
```

**POST /api/hub/questions — Request body:**
```json
{
  "title": "What is wrong with my tomato plant?",
  "body": "Leaves are turning yellow from the edges since last week",
  "photoUrl": null,
  "language": "English",
  "ward": "Ward 12",
  "city": "Latur"
}
```

Logic:
1. Call `geminiService.moderateContent(title + " " + body, "question")` → if inappropriate, return 400
2. Call `geminiService.categorizeQuestion(title, body)` → get category + tags
3. Search for similar existing solved questions (query by same category, compare in Gemini)
4. Call `geminiService.findSimilarQuestions(title, existingQs)` → if hasSimilar, return them with question
5. Create question doc, award +5 points to asker
6. Return `{ id, aiCategory, aiTags, similarQuestions: [] }`

**PATCH /api/hub/questions/:id/answers/:answerId/accept — Logic:**
1. Verify `req.user.uid === question.askerId`
2. Set `answer.isAccepted = true`, set `question.status = "solved"`
3. Award +25 points to answerer: `trustService.addPoints(expertId, "answer_accepted")`
4. Notify expert: "Your answer was accepted! +25 pts"
5. Check if answerer now has 10+ accepted answers → if yes, add "Expert Solver" badge
6. Return updated question + answer

---

### MARKETPLACE ROUTES — `/api/marketplace`

```
POST   /api/marketplace/listings           — Create listing (auth required)
GET    /api/marketplace/listings           — Browse listings (public, with filters)
GET    /api/marketplace/listings/:id       — Get single listing (public)
PATCH  /api/marketplace/listings/:id       — Update listing (auth, seller only)
DELETE /api/marketplace/listings/:id       — Delete/deactivate listing (auth, seller only)
POST   /api/marketplace/listings/:id/claim — Claim a donation (auth required)
POST   /api/marketplace/listings/:id/borrow — Request to borrow (auth required)
POST   /api/marketplace/listings/:id/sold  — Mark as sold/completed (auth, seller only)
GET    /api/marketplace/ai-price           — AI price suggestion (public, rate limited)
GET    /api/marketplace/needs              — Browse need posts (public)
POST   /api/marketplace/needs             — Post a need (auth required)
PATCH  /api/marketplace/needs/:id/fulfill  — Mark need as fulfilled (auth, poster only)
```

**POST /api/marketplace/listings — Request body:**
```json
{
  "title": "NCERT Class 10 Science Book",
  "description": "Good condition, no highlighting or writing",
  "category": "books",
  "listingType": "sell",
  "price": 80,
  "condition": "good",
  "photoUrls": ["firebase_storage_url_1"],
  "lat": 18.4088,
  "lng": 76.5604,
  "ward": "Ward 12",
  "city": "Latur",
  "listingTypeDetails": {
    "borrowDurationDays": null,
    "depositAmount": null,
    "donationPreference": null
  }
}
```

Logic:
1. Check seller trust score >= 50 (minimum to list)
2. Call `geminiService.moderateContent(title + description, "listing")` → reject if inappropriate
3. Call `geminiService.suggestItemPrice(title, condition, category, description)` → get price range
4. Call `geminiService.assessItemCondition(description)` → get AI condition
5. Create listing doc
6. Award Trust Score: donate = +30 points, sell/borrow = +5 points
7. Return listing with AI price suggestion

**GET /api/marketplace/ai-price — Query params:** `?item=pressure+cooker&condition=good&category=appliances`
Apply `aiLimiter`. Call `geminiService.suggestItemPrice()`. Return price range.

**POST /api/marketplace/listings/:id/sold — Logic:**
1. Set `status: "sold"` or `"borrowed"` or `"claimed"`
2. Award +15 points to seller: `trustService.addPoints(sellerId, "item_transacted")`
3. If donate: +30 points instead: `trustService.addPoints(sellerId, "item_donated")`
4. Return updated listing

---

### TRUST ROUTES — `/api/trust`

```
GET    /api/trust/score/:uid         — Get Trust Score + tier + stats (public)
GET    /api/trust/leaderboard        — Ward leaderboard (public)
GET    /api/trust/history/:uid       — Trust Score event history (auth, own only)
GET    /api/trust/badges/:uid        — Get user badges (public)
GET    /api/trust/tiers              — Get all tier definitions (public)
```

**GET /api/trust/leaderboard — Query params:** `?ward=Ward+12&city=Latur&limit=10&period=weekly|alltime`

Logic:
1. Query `users` collection: `where("ward", "==", ward).where("city", "==", city).orderBy("trustScore", "desc").limit(10)`
2. For weekly: query `trust_events` for last 7 days, aggregate points per user, sort
3. Return array with rank, name, trustScore, tier, badges, issuesReported count, questionsAnswered count

---

### DASHBOARD ROUTES — `/api/dashboard`

```
GET    /api/dashboard/stats          — Overall community stats (public)
GET    /api/dashboard/issues-chart   — Issues by category/status for charts (public)
GET    /api/dashboard/aqi-history    — AQI trend data for chart (public)
GET    /api/dashboard/impact         — AI-generated community insight (public, rate limited)
GET    /api/dashboard/top-contributors — Top contributors across all modules (public)
```

**GET /api/dashboard/stats — Query params:** `?city=Latur&ward=Ward+12`

Logic: Run parallel Firestore queries:
```javascript
const [issueStats, questionStats, listingStats, userStats] = await Promise.all([
  db.collection("issues").where("city","==",city).get(),
  db.collection("questions").where("city","==",city).get(),
  db.collection("listings").where("city","==",city).get(),
  db.collection("users").where("city","==",city).get()
]);
```
Aggregate counts, return:
```json
{
  "totalIssues": 0, "resolvedIssues": 0, "openIssues": 0,
  "resolutionRate": "0%",
  "totalQuestions": 0, "solvedQuestions": 0,
  "totalListings": 0, "donatedItems": 0,
  "activeUsers": 0, "totalTrustPoints": 0,
  "aqiAlertsThisMonth": 0
}
```

**GET /api/dashboard/impact — Apply aiLimiter**
Fetch recent issues, call `geminiService.generateIssueSummary(issues)`, return AI insight.

---

## `src/app.js` — EXPRESS SETUP

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security + logging
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Body parsing — 10mb limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting on all routes
app.use("/api/", apiLimiter);

// Health check (no auth, no rate limit)
app.get("/health", (req, res) => res.json({
  status: "ok",
  app: "SamajConnect",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

// Routes
app.use("/api/auth",        require("./routes/auth.routes"));
app.use("/api/issues",      require("./routes/issues.routes"));
app.use("/api/aqi",         require("./routes/aqi.routes"));
app.use("/api/safety",      require("./routes/safety.routes"));
app.use("/api/hub",         require("./routes/hub.routes"));
app.use("/api/marketplace", require("./routes/marketplace.routes"));
app.use("/api/trust",       require("./routes/trust.routes"));
app.use("/api/dashboard",   require("./routes/dashboard.routes"));

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Route not found", code: "NOT_FOUND" }));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
```

---

## `package.json`

```json
{
  "name": "samajconnect-backend",
  "version": "1.0.0",
  "description": "SamajConnect community super-app backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed/seedData.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "firebase-admin": "^12.0.0",
    "@google/generative-ai": "^0.12.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.2.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## SEED DATA — `seed/seedData.js`

```javascript
// Run with: node seed/seedData.js
// Seeds Firestore with realistic demo data for Latur, Maharashtra

// Real Latur coordinates to use:
// City center:           18.4088, 76.5604
// Bus Stand:             18.4095, 76.5590
// Railway Station:       18.4012, 76.5551
// MG Road:               18.4088, 76.5600
// Udgir Road:            18.4150, 76.5700
// Nagar Palika:          18.4060, 76.5580
// Civil Hospital:        18.4075, 76.5625
// Station Road:          18.4050, 76.5560

// Seed the following:

// USERS (5 users, different tiers):
// 1. Sarthak Kulkarni — Silver — Ward 12 — isExpert: true, categories: ["technology", "education"]
// 2. Priya Deshmukh   — Gold   — Ward 8  — isExpert: false
// 3. Ramesh Patil     — Bronze — Ward 12 — isExpert: true, categories: ["agriculture"]
// 4. Dr. Sunita More  — Silver — Ward 5  — isDoctor: true, specialization: "General Physician"
// 5. Ajay Kumar       — Bronze — Ward 15 — isExpert: false

// DOCTORS (8 doctors):
// 1. Dr. Rajesh Kulkarni  — Pulmonologist     — isSurgeMode: false — rating: 4.8 — aqiConsults: 34
// 2. Dr. Sunita Patil     — General Physician — isSurgeMode: true  — rating: 4.6 — aqiConsults: 18
// 3. Dr. Anil Mane        — Cardiologist      — isSurgeMode: false — rating: 4.9 — aqiConsults: 12
// 4. Dr. Priya Desai      — Pediatrician      — isSurgeMode: true  — rating: 4.7 — aqiConsults: 22
// 5. Dr. Suresh Jadhav    — ENT Specialist    — isSurgeMode: false — rating: 4.5 — aqiConsults: 9
// 6. Dr. Meera Shah       — General Physician — isSurgeMode: true  — rating: 4.4 — aqiConsults: 15
// 7. Dr. Ravi Tiwari      — Pulmonologist     — isSurgeMode: false — rating: 4.3 — aqiConsults: 7
// 8. Dr. Anita Rao        — General Physician — isSurgeMode: false — rating: 4.6 — aqiConsults: 11

// ISSUES (20 issues, mix of wards, categories, statuses):
// Mix: 6 open, 4 verified, 4 in_progress, 4 resolved, 2 rejected
// Categories: 5 pothole, 4 water_leak, 4 streetlight, 4 waste, 3 road_damage
// Severity: 3 critical, 6 high, 8 medium, 3 low
// Use realistic Latur street names: MG Road, Station Road, Udgir Road, Civil Hospital Road,
//   Market Chowk, Bus Stand Area, Railway Station Road, Nagar Palika Lane

// QUESTIONS (10 questions with answers):
// Categories: 3 agriculture, 2 legal, 2 medical, 2 plumbing, 1 electrical
// 4 questions have accepted answers (status: solved)
// 4 questions have answers but not accepted (status: answered)
// 2 questions have no answers (status: open)

// LISTINGS (15 listings):
// Mix: 6 sell, 5 donate, 4 borrow
// Categories: 4 books, 3 electronics, 3 appliances, 3 clothing, 2 furniture
// Statuses: 10 active, 3 sold/claimed, 2 borrowed

// RISK ZONES (5 zones in Latur):
// 1. Station Road near flyover — 3 incidents — highRisk: 21:00-23:00
// 2. Market Chowk back lanes — 2 incidents — highRisk: 22:00-01:00
// 3. Bus Stand area — 4 incidents — highRisk: 20:00-23:00
// 4. Udgir Road isolated stretch — 1 incident — highRisk: 06:00-07:00
// 5. Railway Station Road — 2 incidents — highRisk: 21:30-23:30

// AQI READINGS (1 current reading):
// aqi: 158, dominantPollutant: "pm25", spikeExpected: true, predictedAqi: 185
// temperature: 34, humidity: 65

// TRUST EVENTS (10 events for seeded users)
```

---

## BUILD ORDER — FOLLOW EXACTLY

```
Step 1:  mkdir samajconnect-backend && cd samajconnect-backend
         npm init -y && npm install (all dependencies from package.json)
Step 2:  Create .env from .env.example, fill in all keys
Step 3:  src/config/firebase.js — Firebase Admin SDK init + test connection
Step 4:  src/config/gemini.js — Gemini client init
Step 5:  server.js + src/app.js — basic Express server, test GET /health → {"status":"ok"}
Step 6:  src/middleware/auth.js, errorHandler.js, rateLimiter.js
Step 7:  src/services/gemini.service.js — all 12 functions with rate limiting wrapper
Step 8:  src/services/aqi.service.js — WAQI + OpenWeather integration
Step 9:  src/services/trust.service.js — Trust Score + notifications
Step 10: auth routes + controller — register, profile, me
Step 11: issues routes + controller — full CRUD with AI classification
Step 12: aqi routes + controller — live data + doctor listings + health advice
Step 13: safety routes + controller — circle, journey, SOS, risk zones
Step 14: hub routes + controller — Q&A with AI routing + accept flow
Step 15: marketplace routes + controller — listings + AI price + needs
Step 16: trust routes + leaderboard
Step 17: dashboard routes — stats + charts data + AI insight
Step 18: seed/seedData.js — run: node seed/seedData.js
Step 19: Test all endpoints with Postman (collection below)
Step 20: Deploy or run locally for frontend to connect
```

---

## POSTMAN TEST SEQUENCE

```
1.  GET  /health                                     → { status: "ok" }
2.  POST /api/auth/register                          → user created in Firestore
3.  GET  /api/auth/me                                → full profile returned
4.  POST /api/issues  (with description + coords)    → AI category returned
5.  GET  /api/issues?city=Latur&status=open          → list of issues
6.  PATCH /api/issues/:id/upvote                     → verificationCount increments
7.  GET  /api/aqi/current?lat=18.4088&lng=76.5604   → real AQI from WAQI
8.  GET  /api/aqi/doctors?lat=18.4088&lng=76.5604   → doctor list with distances
9.  POST /api/aqi/health-advice                      → AI health advice from Gemini
10. POST /api/safety/journey/start                   → journey created with risk analysis
11. POST /api/safety/sos                             → SOS event + notifications created
12. POST /api/hub/questions                          → question with AI category + tags
13. POST /api/hub/questions/:id/answers              → answer posted
14. GET  /api/marketplace/ai-price?item=book...      → AI price suggestion
15. POST /api/marketplace/listings                   → listing with AI condition + price
16. GET  /api/trust/leaderboard?ward=Ward+12&city=Latur → top 10 users
17. GET  /api/dashboard/stats?city=Latur             → community stats
18. GET  /api/dashboard/impact?city=Latur            → AI community insight
```

---

## CRITICAL RULES FOR AI CODING ASSISTANT

- Generate **complete, production-quality code** — not stubs or pseudocode
- Every controller must use `try/catch` with `next(err)` passed to global error handler
- All Firestore writes must use `FieldValue.serverTimestamp()` for `createdAt`/`updatedAt`
- All Gemini service functions must have:
  1. A try/catch wrapper
  2. A hardcoded fallback object returned on failure (never throw to caller)
  3. The `parseGeminiJSON()` helper to strip markdown fences
  4. The `rateLimitedCall()` wrapper to respect free tier limits
- Auth middleware must be applied to all POST/PATCH/DELETE routes
- GET routes for public data (issues feed, AQI, questions, listings, leaderboard) do NOT require auth
- Geo-filtering for nearby queries: use bounding box approach (lat/lng ± delta), then Haversine distance filter in-memory
- CORS is configured only for `FRONTEND_URL` — never use `origin: "*"` in production
- The `express-rate-limit` `aiLimiter` must be applied to all routes that call Gemini
- Body size limit is 10mb to accommodate base64 image uploads for issue reporting
- `helmet()` must be included for basic security headers
- Use `console.warn` (not `console.error`) for non-critical Gemini fallback events so logs stay clean
- The seed script must be idempotent — running it twice should not create duplicate data (check before inserting)
- All amounts are in Indian Rupees (INR) — no dollar signs anywhere
- Default city for all unspecified location queries: Latur, Maharashtra (18.4088, 76.5604)

---

*SamajConnect Backend · Desktop Web Platform*
*Node.js · Express · Firebase Admin · Gemini 1.5 Flash · WAQI · OpenWeatherMap*
*City: Latur, Maharashtra · For the community, by the community*
