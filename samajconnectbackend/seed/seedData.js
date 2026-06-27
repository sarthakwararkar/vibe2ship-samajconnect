/**
 * SamajConnect — Seed Data Script
 * Run with: node seed/seedData.js
 * Seeds Firestore with realistic demo data for Latur, Maharashtra
 * Idempotent: checks before inserting to prevent duplicates
 */

require("dotenv").config();
const { db, FieldValue, Timestamp } = require("../src/config/firebase");

// ─── Latur Coordinates ────────────────────────────────────────────────────────
const COORDS = {
  cityCenter:     { lat: 18.4088, lng: 76.5604 },
  busStand:       { lat: 18.4095, lng: 76.5590 },
  railwayStation: { lat: 18.4012, lng: 76.5551 },
  mgRoad:         { lat: 18.4088, lng: 76.5600 },
  udgirRoad:      { lat: 18.4150, lng: 76.5700 },
  nagarPalika:    { lat: 18.4060, lng: 76.5580 },
  civilHospital:  { lat: 18.4075, lng: 76.5625 },
  stationRoad:    { lat: 18.4050, lng: 76.5560 },
};

async function checkExisting(collection, field, value) {
  const snap = await db.collection(collection).where(field, "==", value).limit(1).get();
  return !snap.empty;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED USERS
// ═══════════════════════════════════════════════════════════════════════════════
async function seedUsers() {
  console.log("🔹 Seeding users...");

  const users = [
    {
      uid: "user_sarthak_001",
      email: "sarthak@example.com",
      name: "Sarthak Kulkarni",
      photoUrl: null,
      ward: "Ward 12",
      city: "Latur",
      state: "Maharashtra",
      lat: 18.4088, lng: 76.5604,
      trustScore: 450,
      tier: "Silver",
      badges: ["first_report"],
      isExpert: true,
      expertCategories: ["technology", "education"],
      languages: ["Marathi", "Hindi", "English"],
      isDoctor: false, isSurgeMode: false,
      specialization: null, clinicName: null,
      aqiConsultCount: 0, avgResponseMinutes: null,
      consultationFee: null, offersVideo: false, offersWalkIn: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      uid: "user_priya_002",
      email: "priya@example.com",
      name: "Priya Deshmukh",
      photoUrl: null,
      ward: "Ward 8",
      city: "Latur",
      state: "Maharashtra",
      lat: 18.4095, lng: 76.5590,
      trustScore: 920,
      tier: "Gold",
      badges: ["first_report", "community_hero"],
      isExpert: false,
      expertCategories: [],
      languages: ["Marathi", "Hindi"],
      isDoctor: false, isSurgeMode: false,
      specialization: null, clinicName: null,
      aqiConsultCount: 0, avgResponseMinutes: null,
      consultationFee: null, offersVideo: false, offersWalkIn: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      uid: "user_ramesh_003",
      email: "ramesh@example.com",
      name: "Ramesh Patil",
      photoUrl: null,
      ward: "Ward 12",
      city: "Latur",
      state: "Maharashtra",
      lat: 18.4060, lng: 76.5580,
      trustScore: 120,
      tier: "Bronze",
      badges: [],
      isExpert: true,
      expertCategories: ["agriculture"],
      languages: ["Marathi", "Hindi"],
      isDoctor: false, isSurgeMode: false,
      specialization: null, clinicName: null,
      aqiConsultCount: 0, avgResponseMinutes: null,
      consultationFee: null, offersVideo: false, offersWalkIn: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      uid: "user_sunita_004",
      email: "sunita@example.com",
      name: "Dr. Sunita More",
      photoUrl: null,
      ward: "Ward 5",
      city: "Latur",
      state: "Maharashtra",
      lat: 18.4075, lng: 76.5625,
      trustScore: 380,
      tier: "Silver",
      badges: [],
      isExpert: false,
      expertCategories: [],
      languages: ["Marathi", "Hindi", "English"],
      isDoctor: true, isSurgeMode: false,
      specialization: "General Physician",
      clinicName: "More Health Clinic",
      aqiConsultCount: 11, avgResponseMinutes: 15,
      consultationFee: 200, offersVideo: true, offersWalkIn: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      uid: "user_ajay_005",
      email: "ajay@example.com",
      name: "Ajay Kumar",
      photoUrl: null,
      ward: "Ward 15",
      city: "Latur",
      state: "Maharashtra",
      lat: 18.4150, lng: 76.5700,
      trustScore: 75,
      tier: "Bronze",
      badges: [],
      isExpert: false,
      expertCategories: [],
      languages: ["Hindi", "English"],
      isDoctor: false, isSurgeMode: false,
      specialization: null, clinicName: null,
      aqiConsultCount: 0, avgResponseMinutes: null,
      consultationFee: null, offersVideo: false, offersWalkIn: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ];

  for (const user of users) {
    const exists = await db.collection("users").doc(user.uid).get();
    if (!exists.exists) {
      await db.collection("users").doc(user.uid).set(user);
      console.log(`  ✅ Created user: ${user.name}`);
    } else {
      console.log(`  ⏭️  User exists: ${user.name}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED DOCTORS
// ═══════════════════════════════════════════════════════════════════════════════
async function seedDoctors() {
  console.log("🔹 Seeding doctors...");

  const doctors = [
    {
      name: "Dr. Rajesh Kulkarni", specialization: "Pulmonologist",
      relevantPollutants: ["pm25", "pm10"], clinicName: "Latur City Clinic",
      address: "MG Road, Latur", lat: 18.4090, lng: 76.5610,
      phone: "+919876543210", email: "dr.rajesh@example.com",
      isSurgeMode: false, isAvailable: true,
      availableFrom: "09:00", availableTo: "21:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat"],
      avgResponseMinutes: 8, rating: 4.8, reviewCount: 34, aqiConsultCount: 34,
      consultationFee: 300, offersVideo: true, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Sunita Patil", specialization: "General Physician",
      relevantPollutants: ["pm25", "pm10", "o3", "no2"], clinicName: "Patil Medical Centre",
      address: "Station Road, Latur", lat: 18.4050, lng: 76.5560,
      phone: "+919876543211", email: "dr.sunita@example.com",
      isSurgeMode: true, isAvailable: true,
      availableFrom: "10:00", availableTo: "20:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri"],
      avgResponseMinutes: 12, rating: 4.6, reviewCount: 22, aqiConsultCount: 18,
      consultationFee: 200, offersVideo: true, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Anil Mane", specialization: "Cardiologist",
      relevantPollutants: ["pm25", "co", "no2"], clinicName: "Heart Care Hospital",
      address: "Civil Hospital Road, Latur", lat: 18.4075, lng: 76.5625,
      phone: "+919876543212", email: "dr.anil@example.com",
      isSurgeMode: false, isAvailable: true,
      availableFrom: "09:00", availableTo: "18:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat"],
      avgResponseMinutes: 15, rating: 4.9, reviewCount: 45, aqiConsultCount: 12,
      consultationFee: 500, offersVideo: false, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Priya Desai", specialization: "Pediatrician",
      relevantPollutants: ["pm25", "pm10", "o3", "no2"], clinicName: "Kids Care Clinic",
      address: "Market Chowk, Latur", lat: 18.4100, lng: 76.5615,
      phone: "+919876543213", email: "dr.priya.desai@example.com",
      isSurgeMode: true, isAvailable: true,
      availableFrom: "10:00", availableTo: "19:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat"],
      avgResponseMinutes: 10, rating: 4.7, reviewCount: 28, aqiConsultCount: 22,
      consultationFee: 250, offersVideo: true, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Suresh Jadhav", specialization: "ENT Specialist",
      relevantPollutants: ["pm25", "pm10", "so2"], clinicName: "Jadhav ENT Clinic",
      address: "Udgir Road, Latur", lat: 18.4150, lng: 76.5700,
      phone: "+919876543214", email: "dr.suresh@example.com",
      isSurgeMode: false, isAvailable: true,
      availableFrom: "09:00", availableTo: "17:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri"],
      avgResponseMinutes: 20, rating: 4.5, reviewCount: 15, aqiConsultCount: 9,
      consultationFee: 350, offersVideo: false, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Meera Shah", specialization: "General Physician",
      relevantPollutants: ["pm25", "pm10", "o3", "no2", "so2", "co"], clinicName: "Shah Family Clinic",
      address: "Bus Stand Area, Latur", lat: 18.4095, lng: 76.5590,
      phone: "+919876543215", email: "dr.meera@example.com",
      isSurgeMode: true, isAvailable: true,
      availableFrom: "08:00", availableTo: "22:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      avgResponseMinutes: 5, rating: 4.4, reviewCount: 19, aqiConsultCount: 15,
      consultationFee: 150, offersVideo: true, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Ravi Tiwari", specialization: "Pulmonologist",
      relevantPollutants: ["pm25", "pm10", "o3"], clinicName: "Tiwari Lung Clinic",
      address: "Nagar Palika Lane, Latur", lat: 18.4060, lng: 76.5580,
      phone: "+919876543216", email: "dr.ravi@example.com",
      isSurgeMode: false, isAvailable: true,
      availableFrom: "10:00", availableTo: "18:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri"],
      avgResponseMinutes: 25, rating: 4.3, reviewCount: 11, aqiConsultCount: 7,
      consultationFee: 400, offersVideo: false, offersWalkIn: true, isVerified: true
    },
    {
      name: "Dr. Anita Rao", specialization: "General Physician",
      relevantPollutants: ["pm25", "pm10", "o3", "no2", "so2", "co"], clinicName: "Rao Medical",
      address: "Railway Station Road, Latur", lat: 18.4012, lng: 76.5551,
      phone: "+919876543217", email: "dr.anita@example.com",
      isSurgeMode: false, isAvailable: true,
      availableFrom: "09:00", availableTo: "20:00",
      availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat"],
      avgResponseMinutes: 18, rating: 4.6, reviewCount: 25, aqiConsultCount: 11,
      consultationFee: 200, offersVideo: true, offersWalkIn: true, isVerified: true
    }
  ];

  for (const doc of doctors) {
    const exists = await checkExisting("doctors", "email", doc.email);
    if (!exists) {
      await db.collection("doctors").add({
        ...doc,
        uid: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Created doctor: ${doc.name}`);
    } else {
      console.log(`  ⏭️  Doctor exists: ${doc.name}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED ISSUES
// ═══════════════════════════════════════════════════════════════════════════════
async function seedIssues() {
  console.log("🔹 Seeding issues...");

  const issues = [
    // 5 potholes
    { reporterId: "user_sarthak_001", reporterName: "Sarthak Kulkarni", reporterTier: "Silver", description: "Large pothole near HDFC Bank causing accidents", category: "pothole", severity: "critical", address: "MG Road, near HDFC Bank, Latur", ward: "Ward 12", status: "open", ...COORDS.mgRoad, upvotes: 8, verificationCount: 4 },
    { reporterId: "user_priya_002", reporterName: "Priya Deshmukh", reporterTier: "Gold", description: "Multiple potholes on Bus Stand approach road", category: "pothole", severity: "high", address: "Bus Stand Area, Latur", ward: "Ward 8", status: "verified", ...COORDS.busStand, upvotes: 12, verificationCount: 5 },
    { reporterId: "user_ajay_005", reporterName: "Ajay Kumar", reporterTier: "Bronze", description: "Small pothole forming near Udgir Road junction", category: "pothole", severity: "medium", address: "Udgir Road Junction, Latur", ward: "Ward 15", status: "in_progress", ...COORDS.udgirRoad, upvotes: 3, verificationCount: 2 },
    { reporterId: "user_ramesh_003", reporterName: "Ramesh Patil", reporterTier: "Bronze", description: "Deep pothole on Station Road causing water logging", category: "pothole", severity: "high", address: "Station Road, Latur", ward: "Ward 12", status: "resolved", ...COORDS.stationRoad, upvotes: 15, verificationCount: 7 },
    { reporterId: "user_sarthak_001", reporterName: "Sarthak Kulkarni", reporterTier: "Silver", description: "Road surface damaged near Nagar Palika", category: "pothole", severity: "medium", address: "Nagar Palika Lane, Latur", ward: "Ward 12", status: "open", ...COORDS.nagarPalika, upvotes: 2, verificationCount: 1 },
    // 4 water leaks
    { reporterId: "user_priya_002", reporterName: "Priya Deshmukh", reporterTier: "Gold", description: "Major water pipeline leak flooding MG Road", category: "water_leak", severity: "critical", address: "MG Road near SBI, Latur", ward: "Ward 8", status: "in_progress", lat: 18.4085, lng: 76.5598, upvotes: 20, verificationCount: 8 },
    { reporterId: "user_ramesh_003", reporterName: "Ramesh Patil", reporterTier: "Bronze", description: "Tap leaking at public water stand", category: "water_leak", severity: "low", address: "Market Chowk, Latur", ward: "Ward 12", status: "resolved", lat: 18.4100, lng: 76.5615, upvotes: 4, verificationCount: 2 },
    { reporterId: "user_ajay_005", reporterName: "Ajay Kumar", reporterTier: "Bronze", description: "Underground pipe burst near railway crossing", category: "water_leak", severity: "high", address: "Railway Station Road, Latur", ward: "Ward 15", status: "verified", ...COORDS.railwayStation, upvotes: 6, verificationCount: 3 },
    { reporterId: "user_sunita_004", reporterName: "Dr. Sunita More", reporterTier: "Silver", description: "Water seeping from cracked pipe on Civil Hospital Road", category: "water_leak", severity: "medium", address: "Civil Hospital Road, Latur", ward: "Ward 5", status: "open", ...COORDS.civilHospital, upvotes: 3, verificationCount: 1 },
    // 4 streetlights
    { reporterId: "user_sarthak_001", reporterName: "Sarthak Kulkarni", reporterTier: "Silver", description: "Streetlight not working for 2 weeks near school", category: "streetlight", severity: "high", address: "MG Road, near DPS School, Latur", ward: "Ward 12", status: "open", lat: 18.4092, lng: 76.5608, upvotes: 5, verificationCount: 3 },
    { reporterId: "user_priya_002", reporterName: "Priya Deshmukh", reporterTier: "Gold", description: "Entire block of streetlights dark on Station Road", category: "streetlight", severity: "critical", address: "Station Road, Latur", ward: "Ward 8", status: "in_progress", ...COORDS.stationRoad, upvotes: 18, verificationCount: 9 },
    { reporterId: "user_ramesh_003", reporterName: "Ramesh Patil", reporterTier: "Bronze", description: "Flickering streetlight creating safety hazard", category: "streetlight", severity: "medium", address: "Udgir Road, Latur", ward: "Ward 12", status: "resolved", lat: 18.4145, lng: 76.5695, upvotes: 2, verificationCount: 1 },
    { reporterId: "user_ajay_005", reporterName: "Ajay Kumar", reporterTier: "Bronze", description: "New colony area has no streetlights installed", category: "streetlight", severity: "high", address: "New Colony, Udgir Road, Latur", ward: "Ward 15", status: "open", lat: 18.4155, lng: 76.5710, upvotes: 7, verificationCount: 3 },
    // 4 waste
    { reporterId: "user_priya_002", reporterName: "Priya Deshmukh", reporterTier: "Gold", description: "Garbage overflowing from municipal bin for 3 days", category: "waste", severity: "high", address: "Market Chowk, Latur", ward: "Ward 8", status: "verified", lat: 18.4098, lng: 76.5612, upvotes: 9, verificationCount: 4 },
    { reporterId: "user_sarthak_001", reporterName: "Sarthak Kulkarni", reporterTier: "Silver", description: "Illegal waste dumping near residential area", category: "waste", severity: "medium", address: "Behind Bus Stand, Latur", ward: "Ward 12", status: "in_progress", lat: 18.4098, lng: 76.5585, upvotes: 6, verificationCount: 3 },
    { reporterId: "user_sunita_004", reporterName: "Dr. Sunita More", reporterTier: "Silver", description: "Medical waste improperly disposed near hospital", category: "waste", severity: "high", address: "Civil Hospital Road, Latur", ward: "Ward 5", status: "rejected", lat: 18.4078, lng: 76.5628, upvotes: 1, verificationCount: 0 },
    { reporterId: "user_ramesh_003", reporterName: "Ramesh Patil", reporterTier: "Bronze", description: "Construction debris blocking drain on MG Road", category: "waste", severity: "medium", address: "MG Road, Latur", ward: "Ward 12", status: "resolved", lat: 18.4086, lng: 76.5602, upvotes: 4, verificationCount: 2 },
    // 3 road damage
    { reporterId: "user_ajay_005", reporterName: "Ajay Kumar", reporterTier: "Bronze", description: "Road cave-in near Bus Stand after heavy rain", category: "road_damage", severity: "critical", address: "Bus Stand Area, Latur", ward: "Ward 15", status: "verified", ...COORDS.busStand, upvotes: 22, verificationCount: 10 },
    { reporterId: "user_sarthak_001", reporterName: "Sarthak Kulkarni", reporterTier: "Silver", description: "Speed breaker damaged and causing vehicle damage", category: "road_damage", severity: "medium", address: "Railway Station Road, Latur", ward: "Ward 12", status: "rejected", lat: 18.4015, lng: 76.5555, upvotes: 1, verificationCount: 0 },
    { reporterId: "user_priya_002", reporterName: "Priya Deshmukh", reporterTier: "Gold", description: "Footpath broken and unusable near market", category: "road_damage", severity: "low", address: "Market Chowk, Latur", ward: "Ward 8", status: "open", lat: 18.4102, lng: 76.5618, upvotes: 3, verificationCount: 1 },
  ];

  for (const issue of issues) {
    const exists = await checkExisting("issues", "description", issue.description);
    if (!exists) {
      await db.collection("issues").add({
        ...issue,
        city: "Latur",
        photoUrl: null, videoUrl: null,
        aiCategory: issue.category,
        aiSeverity: issue.severity,
        aiConfidence: 0.85 + Math.random() * 0.1,
        aiDepartment: getDepartment(issue.category),
        assignedDepartment: getDepartment(issue.category),
        upvotedBy: [],
        verifiedBy: [],
        isDuplicate: false,
        duplicateOf: null,
        resolvedAt: issue.status === "resolved" ? FieldValue.serverTimestamp() : null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Created issue: ${issue.description.slice(0, 50)}...`);
    } else {
      console.log(`  ⏭️  Issue exists: ${issue.description.slice(0, 50)}...`);
    }
  }
}

function getDepartment(category) {
  const map = {
    pothole: "PWD", water_leak: "water_board", streetlight: "electricity",
    waste: "sanitation", road_damage: "PWD", other: "municipal"
  };
  return map[category] || "municipal";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED QUESTIONS & ANSWERS
// ═══════════════════════════════════════════════════════════════════════════════
async function seedQuestions() {
  console.log("🔹 Seeding questions...");

  const questions = [
    // Agriculture (3)
    { askerId: "user_ramesh_003", askerName: "Ramesh Patil", askerTier: "Bronze", title: "What is wrong with my tomato plant?", body: "Leaves are turning yellow from the edges since last week", category: "agriculture", status: "solved", ward: "Ward 12" },
    { askerId: "user_ajay_005", askerName: "Ajay Kumar", askerTier: "Bronze", title: "Best time to plant onion in Latur?", body: "Want to start onion farming this season, what is the ideal planting window?", category: "agriculture", status: "answered", ward: "Ward 15" },
    { askerId: "user_sarthak_001", askerName: "Sarthak Kulkarni", askerTier: "Silver", title: "How to protect crops from unseasonal rain?", body: "Weatherman says heavy rain next week. My jowar crop is at harvest stage.", category: "agriculture", status: "open", ward: "Ward 12" },
    // Legal (2)
    { askerId: "user_priya_002", askerName: "Priya Deshmukh", askerTier: "Gold", title: "How to file RTI for road repair?", body: "MG Road has been damaged for 6 months. Want to file RTI to know fund allocation.", category: "legal", status: "solved", ward: "Ward 8" },
    { askerId: "user_ajay_005", askerName: "Ajay Kumar", askerTier: "Bronze", title: "Property dispute with neighbor about boundary wall", body: "Neighbor built wall 2 feet into my property. Need legal advice.", category: "legal", status: "answered", ward: "Ward 15" },
    // Medical (2)
    { askerId: "user_sunita_004", askerName: "Dr. Sunita More", askerTier: "Silver", title: "Is cough from AQI or infection?", body: "Many patients coming with persistent dry cough. AQI has been above 150 for a week.", category: "medical", status: "solved", ward: "Ward 5" },
    { askerId: "user_ramesh_003", askerName: "Ramesh Patil", askerTier: "Bronze", title: "Home remedies for dust allergy?", body: "Getting sneezing and watery eyes every morning, especially during harvest season.", category: "medical", status: "answered", ward: "Ward 12" },
    // Plumbing (2)
    { askerId: "user_sarthak_001", askerName: "Sarthak Kulkarni", askerTier: "Silver", title: "Low water pressure in building", body: "All flats on 3rd floor getting very low water pressure. Municipal supply seems fine at ground level.", category: "plumbing", status: "solved", ward: "Ward 12" },
    { askerId: "user_priya_002", askerName: "Priya Deshmukh", askerTier: "Gold", title: "Sewer line blocked repeatedly", body: "Our lane sewer line gets blocked every monsoon. Is there a permanent solution?", category: "plumbing", status: "open", ward: "Ward 8" },
    // Electrical (1)
    { askerId: "user_ajay_005", askerName: "Ajay Kumar", askerTier: "Bronze", title: "Voltage fluctuation damaging appliances", body: "Getting frequent voltage drops in our area. Two inverter batteries already damaged.", category: "electrical", status: "answered", ward: "Ward 15" },
  ];

  const answers = {
    "What is wrong with my tomato plant?": [
      { expertId: "user_ramesh_003", expertName: "Suresh Patil (Community)", expertTier: "Gold", expertCategory: "agriculture", body: "This looks like early blight caused by Alternaria solani. Remove affected leaves, apply copper-based fungicide, and ensure proper spacing between plants for air circulation. Also check if you're overwatering — tomatoes in Latur soil don't need daily watering.", isAccepted: true }
    ],
    "Best time to plant onion in Latur?": [
      { expertId: "user_sarthak_001", expertName: "Sarthak Kulkarni", expertTier: "Silver", expertCategory: "agriculture", body: "For Latur region, kharif onion planting is best from June to July. Rabi onion should be planted between October and November for best yield. Use N-53 or Baswant-780 varieties which do well in our climate.", isAccepted: false }
    ],
    "How to file RTI for road repair?": [
      { expertId: "user_priya_002", expertName: "Legal Expert", expertTier: "Gold", expertCategory: "legal", body: "You can file RTI online at rtionline.gov.in. Address it to the PIO of Latur Municipal Corporation. Ask for: 1) Funds allocated for MG Road repair in last 3 years, 2) Tender details for road work, 3) Timeline for completion. Fee is Rs. 10 via postal order.", isAccepted: true }
    ],
    "Property dispute with neighbor about boundary wall": [
      { expertId: "user_sarthak_001", expertName: "Sarthak Kulkarni", expertTier: "Silver", expertCategory: "legal", body: "First get a survey done by the Talathi office to establish exact boundaries. Take photos as evidence. If survey confirms encroachment, send a legal notice through a lawyer. Avoid physical confrontation.", isAccepted: false }
    ],
    "Is cough from AQI or infection?": [
      { expertId: "user_sunita_004", expertName: "Dr. Sunita More", expertTier: "Silver", expertCategory: "medical", body: "With AQI consistently above 150, pollution-induced cough is very likely. Key difference: pollution cough is dry, worse outdoors, improves with clean air. Infection cough has mucus, fever, body ache. Recommend N95 masks and air purifiers for homes near traffic areas.", isAccepted: true }
    ],
    "Home remedies for dust allergy?": [
      { expertId: "user_sunita_004", expertName: "Dr. Sunita More", expertTier: "Silver", expertCategory: "medical", body: "Steam inhalation with eucalyptus oil 2x daily. Honey with warm water in morning. Keep windows closed during harvest. Wash face and hands after coming indoors. If symptoms persist more than 2 weeks, please visit a doctor for proper antihistamines.", isAccepted: false }
    ],
    "Low water pressure in building": [
      { expertId: "user_ramesh_003", expertName: "Ramesh Patil", expertTier: "Bronze", expertCategory: "plumbing", body: "This is common in Latur buildings. Check if the overhead tank inlet valve is fully open. The 3rd floor issue suggests the tank may not have enough head pressure. Solutions: 1) Install a booster pump, 2) Check for pipe blockage with calcium deposits, 3) Ensure tank is at proper height.", isAccepted: true }
    ],
    "Voltage fluctuation damaging appliances": [
      { expertId: "user_sarthak_001", expertName: "Sarthak Kulkarni", expertTier: "Silver", expertCategory: "electrical", body: "File a complaint with MSEDCL Latur division. Meanwhile, install a voltage stabilizer (3-5 KVA) for sensitive appliances. Consider a whole-house surge protector. Keep records of damaged items for compensation claim.", isAccepted: false }
    ]
  };

  for (const q of questions) {
    const exists = await checkExisting("questions", "title", q.title);
    if (!exists) {
      const qRef = db.collection("questions").doc();
      const qAnswers = answers[q.title] || [];

      await qRef.set({
        ...q,
        photoUrl: null,
        city: "Latur",
        aiCategory: q.category,
        aiRoutedTo: `${q.category}_expert`,
        aiTags: [],
        language: "English",
        answerCount: qAnswers.length,
        upvotes: Math.floor(Math.random() * 15),
        upvotedBy: [],
        isFeatured: false,
        viewCount: Math.floor(Math.random() * 50) + 5,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Add answers
      for (const ans of qAnswers) {
        await qRef.collection("answers").add({
          ...ans,
          photoUrl: null,
          upvotes: Math.floor(Math.random() * 10),
          upvotedBy: [],
          createdAt: FieldValue.serverTimestamp()
        });
      }

      console.log(`  ✅ Created question: ${q.title} (${qAnswers.length} answers)`);
    } else {
      console.log(`  ⏭️  Question exists: ${q.title}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED LISTINGS
// ═══════════════════════════════════════════════════════════════════════════════
async function seedListings() {
  console.log("🔹 Seeding listings...");

  const listings = [
    // Books (4)
    { sellerId: "user_sarthak_001", sellerName: "Sarthak Kulkarni", sellerTier: "Silver", title: "NCERT Class 10 Science Book", description: "Good condition, no highlighting or writing", category: "books", listingType: "sell", price: 80, condition: "good", status: "active", ward: "Ward 12" },
    { sellerId: "user_priya_002", sellerName: "Priya Deshmukh", sellerTier: "Gold", title: "Complete UPSC preparation set (6 books)", description: "TMH, Laxmikanth, Spectrum — all in excellent condition", category: "books", listingType: "sell", price: 1200, condition: "like_new", status: "active", ward: "Ward 8" },
    { sellerId: "user_ramesh_003", sellerName: "Ramesh Patil", sellerTier: "Bronze", title: "Marathi literature collection", description: "5 classic Marathi novels including Shyamchi Aai", category: "books", listingType: "donate", price: 0, condition: "fair", status: "active", ward: "Ward 12" },
    { sellerId: "user_ajay_005", sellerName: "Ajay Kumar", sellerTier: "Bronze", title: "Engineering drawing instruments set", description: "Complete set with T-square, drafter, compass. Used for 1 semester.", category: "books", listingType: "sell", price: 350, condition: "good", status: "sold", ward: "Ward 15" },
    // Electronics (3)
    { sellerId: "user_sarthak_001", sellerName: "Sarthak Kulkarni", sellerTier: "Silver", title: "JBL portable Bluetooth speaker", description: "JBL Go 2, works perfectly, battery holds 4 hours", category: "electronics", listingType: "sell", price: 800, condition: "good", status: "active", ward: "Ward 12" },
    { sellerId: "user_priya_002", sellerName: "Priya Deshmukh", sellerTier: "Gold", title: "Old Samsung tablet for kids", description: "Samsung Tab A, screen has minor scratch, works fine for YouTube/study apps", category: "electronics", listingType: "donate", price: 0, condition: "fair", status: "claimed", ward: "Ward 8" },
    { sellerId: "user_sunita_004", sellerName: "Dr. Sunita More", sellerTier: "Silver", title: "Digital blood pressure monitor", description: "Omron brand, barely used, comes with batteries", category: "electronics", listingType: "sell", price: 600, condition: "like_new", status: "active", ward: "Ward 5" },
    // Appliances (3)
    { sellerId: "user_ramesh_003", sellerName: "Ramesh Patil", sellerTier: "Bronze", title: "Pressure cooker 5L Prestige", description: "3 years old, works perfectly, comes with extra gasket", category: "appliances", listingType: "borrow", price: 0, condition: "good", status: "active", ward: "Ward 12" },
    { sellerId: "user_ajay_005", sellerName: "Ajay Kumar", sellerTier: "Bronze", title: "Table fan (Usha Mist Air)", description: "Runs well, 3 speed settings. Moving out so selling.", category: "appliances", listingType: "sell", price: 450, condition: "good", status: "active", ward: "Ward 15" },
    { sellerId: "user_sarthak_001", sellerName: "Sarthak Kulkarni", sellerTier: "Silver", title: "Mixer grinder for community kitchen", description: "Bajaj Rex 500W, donating to anyone running a community kitchen or tiffin service", category: "appliances", listingType: "donate", price: 0, condition: "good", status: "active", ward: "Ward 12" },
    // Clothing (3)
    { sellerId: "user_priya_002", sellerName: "Priya Deshmukh", sellerTier: "Gold", title: "Kids school uniforms (age 8-10)", description: "Set of 3 white shirts and 2 navy pants, barely worn", category: "clothing", listingType: "donate", price: 0, condition: "like_new", status: "active", ward: "Ward 8" },
    { sellerId: "user_sunita_004", sellerName: "Dr. Sunita More", sellerTier: "Silver", title: "Winter jacket (women's M)", description: "Warm fleece jacket, used one season. Great for Latur winters.", category: "clothing", listingType: "sell", price: 350, condition: "good", status: "active", ward: "Ward 5" },
    { sellerId: "user_ajay_005", sellerName: "Ajay Kumar", sellerTier: "Bronze", title: "Cricket whites set", description: "Full cricket white uniform, fits M/L. Used for 2 matches only.", category: "clothing", listingType: "borrow", price: 0, condition: "like_new", status: "borrowed", ward: "Ward 15" },
    // Furniture (2)
    { sellerId: "user_ramesh_003", sellerName: "Ramesh Patil", sellerTier: "Bronze", title: "Study table with chair", description: "Wooden study table, sturdy. Chair has cushion. Great for students.", category: "furniture", listingType: "sell", price: 1500, condition: "fair", status: "active", ward: "Ward 12" },
    { sellerId: "user_sarthak_001", sellerName: "Sarthak Kulkarni", sellerTier: "Silver", title: "Bookshelf (3 shelves)", description: "Pine wood bookshelf, wall-mountable. Downsizing.", category: "furniture", listingType: "donate", price: 0, condition: "good", status: "active", ward: "Ward 12" },
  ];

  for (const listing of listings) {
    const exists = await checkExisting("listings", "title", listing.title);
    if (!exists) {
      await db.collection("listings").add({
        ...listing,
        sellerTrustScore: listing.sellerTier === "Gold" ? 920 : listing.sellerTier === "Silver" ? 450 : 120,
        aiSuggestedPriceMin: listing.price > 0 ? Math.round(listing.price * 0.7) : 0,
        aiSuggestedPriceMax: listing.price > 0 ? Math.round(listing.price * 1.3) : 0,
        aiCondition: listing.condition,
        aiConditionNotes: "Assessed from description",
        photoUrls: [],
        lat: COORDS.cityCenter.lat + (Math.random() - 0.5) * 0.01,
        lng: COORDS.cityCenter.lng + (Math.random() - 0.5) * 0.01,
        city: "Latur",
        listingTypeDetails: {
          borrowDurationDays: listing.listingType === "borrow" ? 7 : null,
          depositAmount: listing.listingType === "borrow" ? 100 : null,
          donationPreference: listing.listingType === "donate" ? "anyone" : null
        },
        claimedBy: null,
        viewCount: Math.floor(Math.random() * 30) + 3,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Created listing: ${listing.title}`);
    } else {
      console.log(`  ⏭️  Listing exists: ${listing.title}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED RISK ZONES
// ═══════════════════════════════════════════════════════════════════════════════
async function seedRiskZones() {
  console.log("🔹 Seeding risk zones...");

  const zones = [
    { address: "Station Road near flyover, Latur", ...COORDS.stationRoad, incidentCount: 3, highRiskTimeSlots: ["21:00-23:00"], ward: "Ward 12" },
    { address: "Market Chowk back lanes, Latur", lat: 18.4102, lng: 76.5618, incidentCount: 2, highRiskTimeSlots: ["22:00-01:00"], ward: "Ward 8" },
    { address: "Bus Stand area, Latur", ...COORDS.busStand, incidentCount: 4, highRiskTimeSlots: ["20:00-23:00"], ward: "Ward 8" },
    { address: "Udgir Road isolated stretch, Latur", lat: 18.4160, lng: 76.5720, incidentCount: 1, highRiskTimeSlots: ["06:00-07:00"], ward: "Ward 15" },
    { address: "Railway Station Road, Latur", ...COORDS.railwayStation, incidentCount: 2, highRiskTimeSlots: ["21:30-23:30"], ward: "Ward 12" }
  ];

  for (const zone of zones) {
    const exists = await checkExisting("risk_zones", "address", zone.address);
    if (!exists) {
      await db.collection("risk_zones").add({
        ...zone,
        radiusMeters: 200,
        city: "Latur",
        lastIncident: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Created risk zone: ${zone.address}`);
    } else {
      console.log(`  ⏭️  Risk zone exists: ${zone.address}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED AQI READINGS
// ═══════════════════════════════════════════════════════════════════════════════
async function seedAqiReadings() {
  console.log("🔹 Seeding AQI readings...");

  const exists = await checkExisting("aqi_readings", "city", "Latur");
  if (!exists) {
    await db.collection("aqi_readings").add({
      source: "waqi",
      stationId: "latur",
      ...COORDS.cityCenter,
      ward: "",
      city: "Latur",
      aqi: 158,
      dominantPollutant: "pm25",
      pm25: 68.3,
      pm10: 82.1,
      o3: 35,
      no2: 28,
      so2: null,
      co: null,
      temperature: 34,
      humidity: 65,
      windSpeed: 12,
      predictedAqi: 185,
      spikeExpected: true,
      spikeTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      alertLevel: "unhealthy",
      recordedAt: FieldValue.serverTimestamp()
    });
    console.log("  ✅ Created AQI reading");
  } else {
    console.log("  ⏭️  AQI reading exists");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED TRUST EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
async function seedTrustEvents() {
  console.log("🔹 Seeding trust events...");

  const events = [
    { userId: "user_sarthak_001", event: "issue_reported", points: 50, description: "Reported pothole on MG Road", referenceType: "issue" },
    { userId: "user_sarthak_001", event: "answer_given", points: 15, description: "Answered question about onion planting", referenceType: "question" },
    { userId: "user_priya_002", event: "issue_reported", points: 50, description: "Reported water leak on MG Road", referenceType: "issue" },
    { userId: "user_priya_002", event: "issue_verified", points: 10, description: "Verified pothole report", referenceType: "issue" },
    { userId: "user_priya_002", event: "item_donated", points: 30, description: "Donated Samsung tablet for kids", referenceType: "listing" },
    { userId: "user_ramesh_003", event: "issue_reported", points: 50, description: "Reported deep pothole on Station Road", referenceType: "issue" },
    { userId: "user_ramesh_003", event: "answer_given", points: 15, description: "Answered plumbing question", referenceType: "question" },
    { userId: "user_sunita_004", event: "answer_accepted", points: 25, description: "Answer about AQI cough accepted", referenceType: "question" },
    { userId: "user_sunita_004", event: "doctor_surge_mode", points: 3, description: "Enabled surge mode during AQI alert", referenceType: "doctor" },
    { userId: "user_ajay_005", event: "issue_reported", points: 50, description: "Reported road cave-in near Bus Stand", referenceType: "issue" },
  ];

  // Check if already seeded (use first event as marker)
  const existingEvents = await db.collection("trust_events")
    .where("userId", "==", "user_sarthak_001")
    .limit(1)
    .get();

  if (existingEvents.empty) {
    for (const event of events) {
      await db.collection("trust_events").add({
        ...event,
        referenceId: null,
        createdAt: FieldValue.serverTimestamp()
      });
    }
    console.log(`  ✅ Created ${events.length} trust events`);
  } else {
    console.log("  ⏭️  Trust events already exist");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║        SamajConnect — Seeding Firestore          ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  try {
    await seedUsers();
    await seedDoctors();
    await seedIssues();
    await seedQuestions();
    await seedListings();
    await seedRiskZones();
    await seedAqiReadings();
    await seedTrustEvents();

    console.log("\n✅ Seed complete! Firestore is ready.\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
