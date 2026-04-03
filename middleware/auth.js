const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "malchin-secret-key-2024";
const JWT_EXPIRES = "30d";

function generateToken(user) {
  return jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Нэвтрэх шаардлагатай" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token хүчингүй болсон" });
  }
}

module.exports = { generateToken, verifyToken, JWT_SECRET };
