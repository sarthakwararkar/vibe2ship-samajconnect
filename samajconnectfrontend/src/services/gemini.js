import api from "./api";

// 1. Classify issue image using backend (base64 → category + severity)
export async function classifyIssueImage(base64, description = "", fileName = "") {
  try {
    const res = await api.post("/issues/ai-classify", { photoBase64: base64, description, fileName });
    return res.data;
  } catch (err) {
    console.warn("Backend classifyIssueImage error, using fallback", err);
    // Enhanced local fallback logic based on description and filename
    let category = "other";
    const textToSearch = `${description} ${fileName}`.toLowerCase();
    
    if (textToSearch.includes("pothole") || textToSearch.includes("hole") || textToSearch.includes("pit")) {
      category = "pothole";
    } else if (textToSearch.includes("water") || textToSearch.includes("leak") || textToSearch.includes("pipe") || textToSearch.includes("burst")) {
      category = "water_leak";
    } else if (textToSearch.includes("light") || textToSearch.includes("street") || textToSearch.includes("dark") || textToSearch.includes("lamp")) {
      category = "streetlight";
    } else if (textToSearch.includes("garbage") || textToSearch.includes("waste") || textToSearch.includes("trash") || textToSearch.includes("bin") || textToSearch.includes("overflow")) {
      category = "waste";
    } else if (textToSearch.includes("damage") || textToSearch.includes("road") || textToSearch.includes("crack") || textToSearch.includes("asphalt")) {
      category = "road_damage";
    }
    
    return { 
      category, 
      severity: textToSearch.includes("urgent") || textToSearch.includes("danger") || textToSearch.includes("hazard") || textToSearch.includes("critical") ? "critical" : "medium", 
      confidence: 0.5, 
      reason: "Automated local assessment (AI offline/mocked)" 
    };
  }
}

// 2. Real-time question categorization as user types (debounced)
export async function categorizeQuestion(title, body) {
  try {
    const res = await api.post("/hub/ai-category", { title, body });
    return res.data;
  } catch (err) {
    console.warn("Backend categorizeQuestion error, using fallback", err);
    let category = "other";
    const text = (title + " " + body).toLowerCase();
    if (text.includes("crop") || text.includes("farm") || text.includes("plant") || text.includes("soil")) category = "agriculture";
    else if (text.includes("law") || text.includes("legal") || text.includes("court") || text.includes("property")) category = "legal";
    else if (text.includes("doctor") || text.includes("health") || text.includes("fever") || text.includes("pain")) category = "medical";
    else if (text.includes("pipe") || text.includes("leak") || text.includes("tap")) category = "plumbing";
    else if (text.includes("wire") || text.includes("power") || text.includes("shock") || text.includes("fan")) category = "electrical";
    
    return { 
      category, 
      suggestedExpertType: category !== "other" ? `${category.charAt(0).toUpperCase() + category.slice(1)} Professional` : "Community Expert", 
      tags: [category, "community"], 
      priority: "medium" 
    };
  }
}

// 3. AI price suggestion for marketplace listing
export async function suggestItemPrice(itemName, condition, category) {
  try {
    const res = await api.get("/marketplace/ai-price", {
      params: { item: itemName, condition, category }
    });
    return res.data.priceSuggestion;
  } catch (err) {
    console.warn("Backend suggestItemPrice error, using fallback", err);
    // Simple heuristic-based fallback pricing
    return { minPrice: 100, maxPrice: 500, suggestedPrice: 250, currency: "INR" };
  }
}

// 4. Health advice from AQI + symptoms (used on AQI dashboard)
export async function getAqiHealthAdvice(aqi, pollutant, symptoms = []) {
  try {
    const res = await api.post("/aqi/health-advice", { aqi, pollutant, symptoms });
    return res.data.healthAdvice;
  } catch (err) {
    console.warn("Backend getAqiHealthAdvice error, using fallback", err);
    
    const symptomList = (symptoms || []).map(s => s.toLowerCase());
    const hasSevere = symptomList.some(s => s.includes("breath") || s.includes("chest") || s.includes("tight"));
    const hasIrritation = symptomList.some(s => s.includes("eye") || s.includes("irritat"));
    const hasMild = symptomList.some(s => s.includes("cough") || s.includes("throat") || s.includes("nose") || s.includes("fatigue"));

    let riskLevel = "low";
    if (aqi > 300 || hasSevere) riskLevel = "severe";
    else if (aqi > 150) riskLevel = "high";
    else if (aqi > 50 || hasMild || hasIrritation) riskLevel = "moderate";

    let immediateAdvice = "Air quality is acceptable. Normal activity.";
    if (hasSevere) {
      immediateAdvice = "Severe respiratory symptoms reported. Rest in a clean indoor space and seek medical assistance if symptoms persist.";
    } else if (hasMild) {
      immediateAdvice = "Mild respiratory symptoms reported. Stay hydrated and limit heavy outdoor exertion.";
    } else if (hasIrritation) {
      immediateAdvice = "Eye or skin irritation reported. Rinse thoroughly with clean water and avoid outdoor pollutants.";
    } else if (aqi > 150) {
      immediateAdvice = "High pollution level. Wear an N95 mask and limit outdoor activities.";
    }

    let specialistType = "none";
    let urgency = "routine";
    let tips = ["Keep indoor air clean", "Monitor symptoms closely", "Stay hydrated"];

    if (hasSevere) {
      specialistType = "Pulmonologist";
      urgency = "soon";
      tips = ["Use prescribed inhalers if applicable", "Keep a log of breathing difficulty", "Avoid exposure to dust and smoke"];
    } else if (hasIrritation) {
      specialistType = "Ophthalmologist";
      urgency = "routine";
      tips = ["Wash eyes frequently with cold water", "Avoid rubbing eyes", "Wear protective glasses outdoors"];
    } else if (hasMild) {
      specialistType = "General Physician";
      urgency = "routine";
      tips = ["Gargle with warm salt water", "Drink warm fluids", "Monitor temperature and symptoms"];
    }

    return { 
      riskLevel, 
      immediateAdvice, 
      specialistType, 
      urgency, 
      tips 
    };
  }
}
