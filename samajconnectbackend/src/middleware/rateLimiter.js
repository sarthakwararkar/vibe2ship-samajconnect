const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 10000 : 100,
  message: { error: "Too many requests", code: "RATE_LIMITED" }
});

// Strict limiter for AI endpoints (protect Gemini free tier)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "AI endpoint rate limited", code: "AI_RATE_LIMITED" }
});

module.exports = { apiLimiter, aiLimiter };
