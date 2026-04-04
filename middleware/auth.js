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

// ============ RATE LIMITING (in-memory) ============
const rateLimitStore = new Map();

// Хуучин бичлэгүүдийг цэвэрлэх (5 минут тутам)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Rate limiter middleware үүсгэх
 * @param {number} maxRequests - Нэг цонхонд зөвшөөрөх хүсэлтийн тоо
 * @param {number} windowMs - Цонхны хугацаа (мс), default 60 секунд
 */
function rateLimit(maxRequests = 60, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip + ":" + req.path;
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 1 };
      rateLimitStore.set(key, entry);
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: "Хэт олон хүсэлт. Түр хүлээнэ үү." });
    }
    next();
  };
}

module.exports = { generateToken, verifyToken, rateLimit, JWT_SECRET };
