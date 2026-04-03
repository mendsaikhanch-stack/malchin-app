const express = require("express");
const router = express.Router();
const db = require("../db");
const { generateToken, verifyToken } = require("../middleware/auth");

const getAll = db.prepare("SELECT * FROM users");
const getByPhone = db.prepare("SELECT * FROM users WHERE phone = ?");
const getById = db.prepare("SELECT * FROM users WHERE id = ?");
const insert = db.prepare("INSERT INTO users (phone, name, aimag, sum, bag) VALUES (?, ?, ?, ?, ?)");

// OTP илгээх (SMS gateway холбох хүртэл 4 оронтой код буцаана)
router.post("/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 8) return res.status(400).json({ error: "Утасны дугаар буруу" });

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Хуучин OTP-г устгах
  db.prepare("DELETE FROM otp_codes WHERE phone = ?").run(phone);
  db.prepare("INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)").run(phone, code, expires_at);

  // TODO: Бодит SMS gateway холбох (MessagePro, Unitel SMS гэх мэт)
  console.log(`[OTP] ${phone}: ${code}`);

  res.json({ ok: true, message: "OTP илгээлээ", ...(process.env.NODE_ENV !== "production" ? { code } : {}) });
});

// OTP баталгаажуулах + нэвтрэх/бүртгэх
router.post("/verify-otp", (req, res) => {
  const { phone, code, name, aimag, sum, bag } = req.body;
  if (!phone || !code) return res.status(400).json({ error: "Утас болон код шаардлагатай" });

  const otp = db.prepare("SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1").get(phone, code);
  if (!otp) return res.status(400).json({ error: "Код буруу байна" });
  if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ error: "Кодны хугацаа дууссан" });

  // OTP-г ашигласан гэж тэмдэглэх
  db.prepare("UPDATE otp_codes SET used = 1 WHERE id = ?").run(otp.id);

  // Хэрэглэгч байгаа эсэхийг шалгах
  let user = getByPhone.get(phone);
  if (!user) {
    const result = insert.run(phone, name || "Малчин", aimag || "", sum || "", bag || "");
    user = getById.get(result.lastInsertRowid);
  }

  const token = generateToken(user);
  res.json({ ok: true, token, user });
});

// Хуучин login (backward compatible)
router.post("/login", (req, res) => {
  const { phone } = req.body;
  const user = getByPhone.get(phone);
  if (!user) return res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
  const token = generateToken(user);
  res.json({ ...user, token });
});

// Хуучин create (backward compatible)
router.post("/create", (req, res) => {
  const { phone, name, aimag, sum, bag } = req.body;
  try {
    const result = insert.run(phone, name, aimag || "", sum || "", bag || "");
    const user = getById.get(result.lastInsertRowid);
    const token = generateToken(user);
    res.status(201).json({ ...user, token });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const user = getByPhone.get(phone);
      const token = generateToken(user);
      return res.json({ ...user, token });
    }
    res.status(500).json({ error: e.message });
  }
});

// Профайл авах (token шаардлагатай)
router.get("/me", verifyToken, (req, res) => {
  const user = getById.get(req.user.id);
  if (!user) return res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
  res.json(user);
});

// Профайл шинэчлэх
router.put("/me", verifyToken, (req, res) => {
  const { name, aimag, sum, bag } = req.body;
  db.prepare("UPDATE users SET name=?, aimag=?, sum=?, bag=? WHERE id=?").run(name, aimag || "", sum || "", bag || "", req.user.id);
  res.json(getById.get(req.user.id));
});

// Бүх хэрэглэгчид (админ)
router.get("/", (req, res) => {
  res.json(getAll.all());
});

module.exports = router;
