const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://eventfiy.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth",    require("./routes/authRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/bookings",require("./routes/bookingRoutes"));
app.use("/api/admin",   require("./routes/adminRoutes"));   // ← NEW

app.get("/", (req, res) => res.send("API running..."));

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  console.error("STACK:", err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));