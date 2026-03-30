const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

app.get("/", (req, res) => {
  res.send("API running...");
});

const PORT = process.env.PORT || 5000;

// 👇 Add this BEFORE app.listen
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  console.error("STACK:", err.stack);
  res.status(500).json({ error: err.message });
});
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});