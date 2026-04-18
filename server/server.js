// ═══════════════════════════════════════════════════════════════
//  server.js — Production-hardened entry point for Evencers
// ═══════════════════════════════════════════════════════════════
const express        = require("express");
const cors           = require("cors");
const dotenv         = require("dotenv");
const helmet         = require("helmet");
const rateLimit      = require("express-rate-limit");
const mongoSanitize  = require("express-mongo-sanitize");
const xss            = require("xss-clean");
const hpp            = require("hpp");
const path           = require("path");
const connectDB      = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const isDev = process.env.NODE_ENV !== "production";

// ── Trust proxy (needed for Railway / Vercel / NGINX) ──────────
app.set("trust proxy", 1);

// ═══════════════════════════════════════════════════════════════
// 🔐 SECURITY HEADERS — Helmet
// ═══════════════════════════════════════════════════════════════ 
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow Cloudinary images
    contentSecurityPolicy: false, // handled by frontend (Vite)
  })
);

// ═══════════════════════════════════════════════════════════════
// 🔐 SECURE CORS
// ═══════════════════════════════════════════════════════════════
const allowedOrigins = [
  "http://localhost:5173",
  "https://eventfiy.vercel.app",
  // add more production domains here
];

app.use(
  cors({
    origin(origin, callback) {
      // allow server-to-server (no origin) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ═══════════════════════════════════════════════════════════════
// 🔐 BODY PARSING + API SIZE LIMIT
// ═══════════════════════════════════════════════════════════════
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ═══════════════════════════════════════════════════════════════
// 🔐 NoSQL INJECTION PROTECTION
// ═══════════════════════════════════════════════════════════════
app.use(mongoSanitize());

// ═══════════════════════════════════════════════════════════════
// 🔐 XSS PROTECTION
// ═══════════════════════════════════════════════════════════════
app.use(xss());

// ═══════════════════════════════════════════════════════════════
// 🔐 HTTP PARAMETER POLLUTION PROTECTION
// ═══════════════════════════════════════════════════════════════
app.use(hpp());

// ═══════════════════════════════════════════════════════════════
// 🔐 GLOBAL RATE LIMITING
//    • Dev:  1000 req / 15 min  (no false 429s during development)
//    • Prod:  300 req / 15 min  (raised from 100 — SPAs make many calls)
//    Skips OPTIONS pre-flight requests entirely.
// ═══════════════════════════════════════════════════════════════
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: (req) =>
    req.method === "OPTIONS" ||
    // Skip notification polling in dev so UI doesn't get blocked
    (isDev && req.path.startsWith("/api/notifications")),
});
app.use("/api", globalLimiter);

// ═══════════════════════════════════════════════════════════════
// 🔐 STRICT AUTH RATE LIMITING — 10 attempts / 15 min per IP
// ═══════════════════════════════════════════════════════════════
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,       // relaxed in dev to avoid friction
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

// ═══════════════════════════════════════════════════════════════
// 🔐 NOTIFICATION RATE LIMITING — separate, generous limit
//    Notifications are polled frequently by the frontend Navbar.
//    Give them their own bucket so they don't eat the global quota.
//    • Dev:  unlimited (skip: true)
//    • Prod: 120 req / 5 min per IP  (~1 req every 2.5 s)
// ═══════════════════════════════════════════════════════════════
const notificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many notification requests. Please slow down." },
  skip: () => isDev,           // completely unlimited in development
});

// ═══════════════════════════════════════════════════════════════
// 🔐 PAYMENT RATE LIMITING — 20 requests / 10 min per IP
// ═══════════════════════════════════════════════════════════════
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 200 : 20,
  message: { error: "Too many payment requests. Please slow down." },
});

// ── Static uploads (local fallback only — use Cloudinary in prod) ──
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ═══════════════════════════════════════════════════════════════
// 🔐 ROUTES (with targeted rate limiters)
// ═══════════════════════════════════════════════════════════════
const favoriteRoutes      = require("./routes/favoriteRoutes");
const paymentRoutes       = require("./routes/paymentRoutes");
const notificationRoutes  = require("./routes/notificationRoutes");

// Auth routes → strict rate limiting
app.use("/api/auth",          authLimiter, require("./routes/authRoutes"));

// Admin routes → global limiter already applied
app.use("/api/admin",         require("./routes/adminRoutes"));

// Vendor / booking / favorites
app.use("/api/vendors",       require("./routes/vendorRoutes"));
app.use("/api/bookings",      require("./routes/bookingRoutes"));
app.use("/api/favorites",     favoriteRoutes);

// Notifications → own generous limiter (polled frequently by Navbar)
app.use("/api/notifications", notificationLimiter, notificationRoutes);

// Payment routes → dedicated payment limiter
app.use("/api/payments",      paymentLimiter, paymentRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", app: "Evencers API" }));

// ═══════════════════════════════════════════════════════════════
// 🔐 GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }

  // Log internally (replace with Winston / Sentry in prod)
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.url}:`, err.message);

  // Only expose detailed errors in development
  if (isDev) {
    return res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }

  // Production: generic message only
  res.status(err.status || 500).json({ error: "Something went wrong. Please try again." });
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Evencers server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`)
);