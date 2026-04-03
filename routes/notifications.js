const express = require("express");
const router = express.Router();
const { Expo } = require("expo-server-sdk");
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

const expo = new Expo();

// Push token бүртгэх
router.post("/register-token", verifyToken, (req, res) => {
  const { token } = req.body;
  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: "Push token буруу байна" });
  }
  try {
    db.prepare("INSERT OR REPLACE INTO push_tokens (user_id, token) VALUES (?, ?)").run(req.user.id, token);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Push token устгах
router.delete("/remove-token", verifyToken, (req, res) => {
  const { token } = req.body;
  db.prepare("DELETE FROM push_tokens WHERE user_id = ? AND token = ?").run(req.user.id, token);
  res.json({ ok: true });
});

// Бүх хэрэглэгчдэд notification илгээх (админ)
router.post("/send-all", async (req, res) => {
  const { title, body, data } = req.body;
  if (!title || !body) return res.status(400).json({ error: "Гарчиг болон агуулга шаардлагатай" });

  const tokens = db.prepare("SELECT DISTINCT token FROM push_tokens").all();
  if (tokens.length === 0) return res.json({ ok: true, sent: 0 });

  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({ to: t.token, sound: "default", title, body, data: data || {} }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sent += chunk.length;
    } catch (e) {
      console.error("[Push] Chunk error:", e.message);
    }
  }
  res.json({ ok: true, sent, total: tokens.length });
});

// Тодорхой бүс нутгийн хэрэглэгчдэд илгээх
router.post("/send-region", async (req, res) => {
  const { title, body, region, data } = req.body;
  if (!title || !body || !region) return res.status(400).json({ error: "Гарчиг, агуулга, бүс шаардлагатай" });

  const tokens = db.prepare(`
    SELECT DISTINCT pt.token FROM push_tokens pt
    JOIN users u ON pt.user_id = u.id
    WHERE u.aimag = ?
  `).all(region);

  if (tokens.length === 0) return res.json({ ok: true, sent: 0 });

  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({ to: t.token, sound: "default", title, body, data: data || {} }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sent += chunk.length;
    } catch (e) {
      console.error("[Push] Chunk error:", e.message);
    }
  }
  res.json({ ok: true, sent, total: tokens.length });
});

// Нэг хэрэглэгчид илгээх
router.post("/send-user/:userId", async (req, res) => {
  const { title, body, data } = req.body;
  const tokens = db.prepare("SELECT token FROM push_tokens WHERE user_id = ?").all(req.params.userId);
  if (tokens.length === 0) return res.json({ ok: true, sent: 0 });

  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({ to: t.token, sound: "default", title, body, data: data || {} }));

  try {
    await expo.sendPushNotificationsAsync(messages);
    res.json({ ok: true, sent: messages.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Вакцины сануулга илгээх (cron-д зориулсан)
router.post("/send-vaccine-reminders", async (req, res) => {
  const currentMonth = new Date().getMonth() + 1;
  const monthStr = String(currentMonth).padStart(2, "0");

  // Энэ сарын вакцинуудыг олох
  const vaccines = db.prepare("SELECT * FROM vaccination_schedule WHERE recommended_month LIKE ?").all(`%${monthStr}%`);
  if (vaccines.length === 0) return res.json({ ok: true, sent: 0, message: "Энэ сард вакцин байхгүй" });

  // Тухайн малтай хэрэглэгчдийн token авах
  const allTokens = db.prepare(`
    SELECT DISTINCT pt.token, u.name, l.animal_type FROM push_tokens pt
    JOIN users u ON pt.user_id = u.id
    JOIN livestock l ON l.user_id = u.id
  `).all();

  const messages = [];
  for (const v of vaccines) {
    const relevantTokens = allTokens.filter(t => t.animal_type === v.animal_type);
    for (const t of relevantTokens) {
      if (Expo.isExpoPushToken(t.token)) {
        messages.push({
          to: t.token,
          sound: "default",
          title: `Вакцины сануулга: ${v.vaccine_name}`,
          body: `${v.disease} өвчнөөс сэргийлэх ${v.vaccine_name} вакциныг энэ сард хийлгэнэ үү.`,
          data: { type: "vaccine", vaccineId: v.id }
        });
      }
    }
  }

  if (messages.length === 0) return res.json({ ok: true, sent: 0 });

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sent += chunk.length;
    } catch (e) {
      console.error("[Push] Vaccine reminder error:", e.message);
    }
  }
  res.json({ ok: true, sent, vaccines: vaccines.length });
});

// Цаг агаарын анхааруулга илгээх
router.post("/send-weather-alert", async (req, res) => {
  const { title, body, region, severity } = req.body;
  if (!title || !body) return res.status(400).json({ error: "Гарчиг, агуулга шаардлагатай" });

  let tokens;
  if (region) {
    tokens = db.prepare(`
      SELECT DISTINCT pt.token FROM push_tokens pt
      JOIN users u ON pt.user_id = u.id WHERE u.aimag = ?
    `).all(region);
  } else {
    tokens = db.prepare("SELECT DISTINCT token FROM push_tokens").all();
  }

  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({
      to: t.token,
      sound: "default",
      title: `⚠️ ${title}`,
      body,
      data: { type: "weather_alert", severity: severity || "yellow" }
    }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sent += chunk.length;
    } catch (e) {
      console.error("[Push] Weather alert error:", e.message);
    }
  }
  res.json({ ok: true, sent });
});

module.exports = router;
