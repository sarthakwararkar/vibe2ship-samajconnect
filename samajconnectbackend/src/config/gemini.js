const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Primary model — free tier
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Vision model — same model handles images too
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = { genAI, model, visionModel };
