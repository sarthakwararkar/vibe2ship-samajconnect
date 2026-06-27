import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "mock-key");

function parseJSON(text) {
  try {
    // strip markdown fence if any
    const cleanText = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON parsing error on Gemini response:", text, e);
    throw e;
  }
}

// Helper to handle model fallback when a model is not found/supported in the API key's region or tier
async function generateContentWithFallback(payload, isMultimodal = false) {
  const models = isMultimodal 
    ? ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro-vision"]
    : ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
    
  let lastError = null;
  for (const modelName of models) {
    try {
      const modelInstance = genAI.getGenerativeModel({ model: modelName });
      const result = await modelInstance.generateContent(payload);
      return result;
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("404") || msg.includes("not supported") || msg.includes("unsupported")) {
        console.warn(`Model ${modelName} failed or not found, trying fallback model...`, err.message);
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// 1. Classify issue image in browser (base64 → category + severity)
export async function classifyIssueImage(base64, description = "", fileName = "") {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "mock-gemini-key-xyz") {
      throw new Error("Using mock key, bypass call");
    }
    // base64 contains the data url header like "data:image/jpeg;base64,...", strip it
    const base64Data = base64.includes(";base64,") ? base64.split(";base64,")[1] : base64;
    
    const prompt = `You are an AI for a civic issue reporting platform in India. Analyze this image and description: "${description}". Return ONLY valid JSON: {"category":"pothole|water_leak|streetlight|waste|road_damage|other","severity":"low|medium|high|critical","confidence":0.9,"reason":"one sentence"}`;
    const result = await generateContentWithFallback([
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: base64Data } }
    ], true);
    return parseJSON(result.response.text());
  } catch (err) {
    console.warn("Gemini classifyIssueImage error, using fallback", err);
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
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "mock-gemini-key-xyz") {
      throw new Error("Using mock key, bypass call");
    }
    const prompt = `Categorize this community question for routing to the right expert in an Indian town. Title: "${title}" Body: "${body}". Return ONLY valid JSON: {"category":"agriculture|legal|medical|plumbing|electrical|education|financial|other","suggestedExpertType":"descriptive role","tags":["tag1","tag2"],"priority":"low|medium|high"}`;
    const result = await generateContentWithFallback(prompt);
    return parseJSON(result.response.text());
  } catch (err) {
    console.warn("Gemini categorizeQuestion error, using fallback", err);
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
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "mock-gemini-key-xyz") {
      throw new Error("Using mock key, bypass call");
    }
    const prompt = `Suggest a fair second-hand price for a "${itemName}" in "${condition}" condition (category: "${category}") for a small Indian city (Latur, Maharashtra). Consider typical prices, not metro prices. Return ONLY valid JSON: {"minPrice":number,"maxPrice":number,"suggestedPrice":number,"currency":"INR"}`;
    const result = await generateContentWithFallback(prompt);
    return parseJSON(result.response.text());
  } catch (err) {
    console.warn("Gemini suggestItemPrice error, using fallback", err);
    // Simple heuristic-based fallback pricing
    return { minPrice: 100, maxPrice: 500, suggestedPrice: 250, currency: "INR" };
  }
}

// 4. Health advice from AQI + symptoms (used on AQI dashboard)
export async function getAqiHealthAdvice(aqi, pollutant, symptoms = []) {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "mock-gemini-key-xyz") {
      throw new Error("Using mock key, bypass call");
    }
    const prompt = `Public health advice for Indian citizens. AQI: ${aqi}, Pollutant: ${pollutant}, Symptoms: ${symptoms.join(", ") || "none"}. Return ONLY valid JSON: {"riskLevel":"low|moderate|high|severe","immediateAdvice":"one sentence","specialistType":"specialist or none","urgency":"routine|soon|urgent","tips":["tip1","tip2","tip3"]}`;
    const result = await generateContentWithFallback(prompt);
    return parseJSON(result.response.text());
  } catch (err) {
    console.warn("Gemini getAqiHealthAdvice error, using fallback", err);
    
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
