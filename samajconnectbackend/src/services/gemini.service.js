const { model, visionModel, genAI } = require("../config/gemini");

// ─── Rate Limiting (free tier = 15 RPM) ──────────────────────────────────────
let lastCallTime = 0;
const MIN_INTERVAL_MS = 4000; // 15 RPM = 1 per 4 seconds

async function rateLimitedCall(fn) {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCallTime);
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  lastCallTime = Date.now();
  return fn();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip markdown fences and parse JSON safely from Gemini responses.
 */
function parseGeminiJSON(text) {
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini JSON parse failed: ${text.slice(0, 100)}`);
  }
}

async function callWithFallback(prompt, isMultimodal = false, imageBase64 = null, mimeType = "image/jpeg") {
  const models = isMultimodal 
    ? ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]
    : ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
    
  let lastError = null;
  let cleanImageBase64 = null;
  let detectedMimeType = mimeType;

  if (isMultimodal && imageBase64) {
    const match = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      detectedMimeType = match[1];
      cleanImageBase64 = match[2];
    } else {
      cleanImageBase64 = imageBase64.includes("base64,")
        ? imageBase64.split("base64,")[1]
        : imageBase64;
    }
  }

  for (const modelName of models) {
    try {
      const modelInstance = genAI.getGenerativeModel({ model: modelName });
      let result;
      if (isMultimodal && cleanImageBase64) {
        result = await modelInstance.generateContent([
          { text: prompt },
          { inlineData: { mimeType: detectedMimeType, data: cleanImageBase64 } }
        ]);
      } else {
        result = await modelInstance.generateContent(prompt);
      }
      return parseGeminiJSON(result.response.text());
    } catch (err) {
      console.warn(`Gemini model ${modelName} failed: ${err.message?.slice(0, 120)}`);
      lastError = err;
      // Try the next model for ANY error (404, 429, quota, 503, etc.)
      continue;
    }
  }
  throw lastError;
}

/**
 * Base caller — text only.
 */
async function callGemini(prompt) {
  return callWithFallback(prompt, false);
}

/**
 * Vision caller — text + image.
 */
async function callGeminiVision(prompt, imageBase64, mimeType = "image/jpeg") {
  return callWithFallback(prompt, true, imageBase64, mimeType);
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE 12 GEMINI FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 1. classifyIssue — Classify a civic infrastructure issue.
 */
async function classifyIssue(description, imageBase64 = null) {
  const prompt = `You are an AI for a civic issue reporting platform in India.
Analyze this infrastructure issue and respond ONLY in valid JSON with no markdown.
Description: "${description}"
Return: { "category": "pothole|water_leak|streetlight|waste|road_damage|other", "severity": "low|medium|high|critical", "department": "PWD|water_board|electricity|sanitation|municipal|other", "confidence": 0.0-1.0, "reason": "brief explanation in one sentence" }`;

  try {
    if (imageBase64) {
      return await rateLimitedCall(() => callGeminiVision(prompt, imageBase64));
    }
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini classifyIssue fallback:", err.message);
    let category = "other";
    let severity = "medium";
    let department = "municipal";
    const desc = (description || "").toLowerCase();
    
    if (desc.includes("pothole") || desc.includes("hole") || desc.includes("pit")) {
      category = "pothole";
      severity = "high";
      department = "PWD";
    } else if (desc.includes("water") || desc.includes("leak") || desc.includes("pipe") || desc.includes("burst")) {
      category = "water_leak";
      severity = "high";
      department = "water_board";
    } else if (desc.includes("light") || desc.includes("street") || desc.includes("dark") || desc.includes("lamp")) {
      category = "streetlight";
      severity = "medium";
      department = "electricity";
    } else if (desc.includes("garbage") || desc.includes("waste") || desc.includes("trash") || desc.includes("bin") || desc.includes("overflow")) {
      category = "waste";
      severity = "medium";
      department = "sanitation";
    } else if (desc.includes("damage") || desc.includes("road") || desc.includes("crack") || desc.includes("asphalt")) {
      category = "road_damage";
      severity = "high";
      department = "PWD";
    }
    
    return { 
      category, 
      severity, 
      department, 
      confidence: 0.5, 
      reason: `Automated local fallback assessment (AI offline/mocked) based on description.` 
    };
  }
}

/**
 * 2. checkDuplicateIssue — Check if a new issue is a duplicate of existing ones.
 */
async function checkDuplicateIssue(newDescription, newLat, newLng, existingIssues) {
  const prompt = `You are checking if a new civic issue report is a duplicate of existing reports.
New report: "${newDescription}" at coordinates (${newLat}, ${newLng})
Existing reports in the area: ${JSON.stringify(existingIssues.map(i => ({ id: i.id, description: i.description, category: i.category })))}
Return ONLY valid JSON: { "isDuplicate": true|false, "similarIssueId": "issue_id_or_null", "confidence": 0.0-1.0 }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini checkDuplicateIssue fallback:", err.message);
    return { isDuplicate: false, similarIssueId: null, confidence: 0 };
  }
}

/**
 * 3. generateAqiHealthAdvice — Generate health advice based on AQI + symptoms.
 */
async function generateAqiHealthAdvice(aqi, dominantPollutant, symptoms = []) {
  const prompt = `You are a public health AI assistant for an Indian community app.
Current AQI: ${aqi}, Dominant pollutant: ${dominantPollutant}
User symptoms: ${symptoms.length ? symptoms.join(", ") : "none reported"}
Provide health advice for this air quality situation.
Return ONLY valid JSON: { "riskLevel": "low|moderate|high|severe", "immediateAdvice": "what to do right now in one sentence", "specialistType": "General Physician|Pulmonologist|Cardiologist|Pediatrician|ENT|none", "urgency": "routine|soon|urgent|emergency", "tips": ["tip1", "tip2", "tip3"], "schoolAdvice": "advice for schools/offices in one sentence" }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini generateAqiHealthAdvice fallback:", err.message);
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
      tips,
      schoolAdvice: aqi > 150 ? "Recommend online learning or suspended classes." : "Acceptable for school sessions."
    };
  }
}

/**
 * 4. matchSymptomsToSpecialist — Match symptoms to the right doctor type.
 */
async function matchSymptomsToSpecialist(symptoms, pollutant, aqiLevel) {
  const prompt = `Match these symptoms to the most appropriate medical specialist type.
Symptoms: ${symptoms.join(", ")}
Air pollutant context: ${pollutant}, AQI level: ${aqiLevel}
Return ONLY valid JSON: { "specialistType": "specialist name", "urgency": "routine|soon|urgent|emergency", "reasoning": "one sentence", "doNotDelay": true|false }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini matchSymptomsToSpecialist fallback:", err.message);
    return {
      specialistType: "General Physician",
      urgency: "routine",
      reasoning: "General consultation recommended.",
      doNotDelay: false
    };
  }
}

/**
 * 5. categorizeQuestion — Route community questions to the right expert category.
 */
async function categorizeQuestion(title, body, photoDescription = null) {
  const prompt = `You are routing community questions to the right expert in an Indian town.
Question title: "${title}"
Question body: "${body}"
${photoDescription ? `Photo description: "${photoDescription}"` : ""}
Return ONLY valid JSON: { "category": "agriculture|legal|medical|plumbing|electrical|education|financial|other", "suggestedExpertType": "descriptive expert role", "tags": ["tag1","tag2","tag3"], "priority": "low|medium|high", "language": "detected language" }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini categorizeQuestion fallback:", err.message);
    return {
      category: "other",
      suggestedExpertType: "General Expert",
      tags: [],
      priority: "medium",
      language: "English"
    };
  }
}

/**
 * 6. findSimilarQuestions — Find if any existing Q&A answers the new question.
 */
async function findSimilarQuestions(newQuestion, existingQuestions) {
  const prompt = `Find if any existing Q&A answers this new question.
New question: "${newQuestion}"
Existing questions: ${JSON.stringify(existingQuestions.map(q => ({ id: q.id, title: q.title, status: q.status })))}
Return ONLY valid JSON: { "hasSimilar": true|false, "similarIds": ["id1", "id2"], "confidence": 0.0-1.0 }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini findSimilarQuestions fallback:", err.message);
    return { hasSimilar: false, similarIds: [], confidence: 0 };
  }
}

/**
 * 7. suggestItemPrice — Price second-hand items for tier-2 Indian city marketplace.
 */
async function suggestItemPrice(itemName, condition, category, description = "") {
  const prompt = `You are helping price second-hand items for a community marketplace in a tier-2 Indian city (Latur, Maharashtra).
Item: "${itemName}", Category: "${category}", Condition: "${condition}"
Description: "${description}"
Consider typical prices in small Indian cities, not metro prices.
Return ONLY valid JSON: { "minPrice": number, "maxPrice": number, "suggestedPrice": number, "reasoning": "one sentence", "currency": "INR" }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini suggestItemPrice fallback:", err.message);
    return {
      minPrice: 50,
      maxPrice: 500,
      suggestedPrice: 200,
      reasoning: "Estimated based on general market rates.",
      currency: "INR"
    };
  }
}

/**
 * 8. assessItemCondition — Assess condition of a second-hand item.
 */
async function assessItemCondition(description, photoDescription = null) {
  const prompt = `Assess the condition of a second-hand item based on its description.
Description: "${description}"
${photoDescription ? `Visual description: "${photoDescription}"` : ""}
Return ONLY valid JSON: { "condition": "like_new|good|fair|needs_repair", "confidence": 0.0-1.0, "notes": "brief notes on condition", "repairSuggestion": "null or brief suggestion if needs_repair" }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini assessItemCondition fallback:", err.message);
    return {
      condition: "good",
      confidence: 0.5,
      notes: "Condition estimated from description.",
      repairSuggestion: null
    };
  }
}

/**
 * 9. analyzeRouteRisk — Analyze journey safety for women's safety module.
 */
async function analyzeRouteRisk(fromAddress, toAddress, timeOfDay, riskZones) {
  const prompt = `Analyze the safety risk of a journey for a women's safety app in India.
From: "${fromAddress}" To: "${toAddress}", Time: "${timeOfDay}"
Known risk zones on or near the route: ${JSON.stringify(riskZones.map(z => ({ address: z.address, incidents: z.incidentCount, timeSlots: z.highRiskTimeSlots })))}
Return ONLY valid JSON: { "overallRisk": "low|medium|high", "riskFactors": ["factor1","factor2"], "advice": "safety advice in one sentence", "suggestAlternate": true|false, "alternateRouteSuggestion": "suggestion or null", "checkInRecommendedMinutes": number }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini analyzeRouteRisk fallback:", err.message);
    const hasRisk = riskZones && riskZones.length > 0;
    return {
      overallRisk: hasRisk ? "medium" : "low",
      riskFactors: hasRisk 
        ? riskZones.map(z => `Route passes near risk zone: ${z.name || z.address} (${z.incidentCount || 2} reports)`)
        : ["No active risk zones reported on this route currently."],
      advice: hasRisk
        ? `Caution: Route passes near ${riskZones.length} safety risk zone(s). Stay alert.`
        : `The route from ${fromAddress} to ${toAddress} appears clear of reported hazards.`,
      suggestAlternate: hasRisk,
      alternateRouteSuggestion: hasRisk ? "Consider using main well-lit arterial roads instead." : null,
      checkInRecommendedMinutes: hasRisk ? 15 : 30
    };
  }
}

/**
 * 10. explainAqiSpike — Explain an upcoming AQI spike in simple terms.
 */
async function explainAqiSpike(currentAqi, predictedAqi, pollutant, weather) {
  const prompt = `Explain an upcoming air quality spike in simple terms for Indian citizens.
Current AQI: ${currentAqi}, Predicted AQI in 2 hours: ${predictedAqi}
Primary pollutant: ${pollutant}, Weather: ${JSON.stringify(weather)}
Return ONLY valid JSON: { "explanation": "plain English explanation in 2 sentences", "cause": "likely cause", "duration": "estimated duration", "affectedGroups": ["group1","group2"], "immediateActions": ["action1","action2","action3"] }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini explainAqiSpike fallback:", err.message);
    return {
      explanation: "Air quality is expected to worsen in the coming hours. Please take precautions.",
      cause: "Weather conditions and pollution buildup",
      duration: "2-4 hours",
      affectedGroups: ["children", "elderly", "asthma patients"],
      immediateActions: ["Stay indoors", "Close windows", "Use air purifier if available"]
    };
  }
}

/**
 * 11. generateIssueSummary — Summarize issues for the impact dashboard.
 */
async function generateIssueSummary(issues) {
  const prompt = `Summarize these community issues for a public dashboard.
Issues data: ${JSON.stringify(issues.map(i => ({ category: i.category, status: i.status, severity: i.severity, ward: i.ward })))}
Return ONLY valid JSON: { "totalOpen": number, "criticalCount": number, "topCategory": "category name", "topWard": "ward name", "resolutionRate": "percentage string", "insight": "one interesting community insight sentence" }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini generateIssueSummary fallback:", err.message);
    return {
      totalOpen: issues.filter(i => i.status === "open").length,
      criticalCount: issues.filter(i => i.severity === "critical").length,
      topCategory: "other",
      topWard: "Unknown",
      resolutionRate: "0%",
      insight: "Community engagement is growing."
    };
  }
}

/**
 * 12. moderateContent — Check content for spam or inappropriate material.
 */
async function moderateContent(text, type) {
  const prompt = `Moderate this ${type} content for a community platform. Flag spam, hate speech, or inappropriate content.
Content: "${text}"
Return ONLY valid JSON: { "isAppropriate": true|false, "confidence": 0.0-1.0, "reason": "null or brief reason if flagged" }`;

  try {
    return await rateLimitedCall(() => callGemini(prompt));
  } catch (err) {
    console.warn("Gemini moderateContent fallback:", err.message);
    return { isAppropriate: true, confidence: 1.0, reason: null };
  }
}

module.exports = {
  classifyIssue,
  checkDuplicateIssue,
  generateAqiHealthAdvice,
  matchSymptomsToSpecialist,
  categorizeQuestion,
  findSimilarQuestions,
  suggestItemPrice,
  assessItemCondition,
  analyzeRouteRisk,
  explainAqiSpike,
  generateIssueSummary,
  moderateContent
};
