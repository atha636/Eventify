const jwt = require("jsonwebtoken"); // 👈 ADD THIS

module.exports = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) return res.status(401).json({ msg: "No token" });

  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED:", JSON.stringify(decoded));
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.status(401).json({ msg: "Invalid token" });
  }
};