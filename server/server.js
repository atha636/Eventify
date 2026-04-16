// ═══════════════════════════════════════════════════════════════
//  server.js — Production-hardened entry point for Eventify
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
app.use(express.json({ limit: "10kb" }));          // block huge JSON payloads
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ═══════════════════════════════════════════════════════════════
// 🔐 NoSQL INJECTION PROTECTION — mongo-sanitize
//    strips $ and . from req.body / req.query / req.params
// ═══════════════════════════════════════════════════════════════
app.use(mongoSanitize());

// ═══════════════════════════════════════════════════════════════
// 🔐 XSS PROTECTION — xss-clean
//    sanitizes req.body, req.query, req.params against XSS
// ═══════════════════════════════════════════════════════════════
app.use(xss());

// ═══════════════════════════════════════════════════════════════
// 🔐 HTTP PARAMETER POLLUTION (HPP) PROTECTION
//    prevents ?status=pending&status=approved attacks
// ═══════════════════════════════════════════════════════════════
app.use(hpp());

// ═══════════════════════════════════════════════════════════════
// 🔐 GLOBAL RATE LIMITING — 100 requests / 15 min per IP
// ═══════════════════════════════════════════════════════════════
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: (req) => req.method === "OPTIONS",
});
app.use("/api", globalLimiter);

// ═══════════════════════════════════════════════════════════════
// 🔐 STRICT AUTH RATE LIMITING — 10 attempts / 15 min per IP
//    Prevents brute-force on login/register/OTP endpoints
// ═══════════════════════════════════════════════════════════════
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

// ═══════════════════════════════════════════════════════════════
// 🔐 PAYMENT RATE LIMITING — 20 requests / 10 min per IP
// ═══════════════════════════════════════════════════════════════
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
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

// Vendor / booking / notifications / favorites
app.use("/api/vendors",       require("./routes/vendorRoutes"));
app.use("/api/bookings",      require("./routes/bookingRoutes"));
app.use("/api/favorites",     favoriteRoutes);
app.use("/api/notifications", notificationRoutes);

// Payment routes → dedicated payment limiter
app.use("/api/payments",      paymentLimiter, paymentRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", app: "Eventify API" }));

// ═══════════════════════════════════════════════════════════════
// 🔐 GLOBAL ERROR HANDLER
//    Never leaks stack traces or internal error details in prod
// ═══════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }

  // Log internally (replace with Winston / Sentry in prod)
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.url}:`, err.message);

  // Only expose detailed errors in development
  if (process.env.NODE_ENV === "development") {
    return res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }

  // Production: generic message only
  res.status(err.status || 500).json({ error: "Something went wrong. Please try again." });
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Eventify server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`)
);