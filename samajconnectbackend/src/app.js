require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security + logging
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("dev"));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Body parsing — 10mb limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files for local disk uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));


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
