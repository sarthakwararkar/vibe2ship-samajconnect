module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Firestore errors
  if (typeof err.code === "string" && err.code.startsWith("firestore/")) {
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
