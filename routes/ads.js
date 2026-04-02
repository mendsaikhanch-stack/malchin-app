const express = require("express");
const router = express.Router();
const db = require("../db");

// Тодорхой байршилд зар авах
router.get("/", (req, res) => {
  const { placement, category, limit } = req.query;
  let sql = "SELECT * FROM ads WHERE is_active = 1";
  const params = [];
  if (placement) { sql += " AND (placement = ? OR placement = 'all')"; params.push(placement); }
  if (category) { sql += " AND category = ?"; params.push(category); }
  sql += " ORDER BY priority DESC, RANDOM()";
  if (limit) { sql += " LIMIT ?"; params.push(parseInt(limit) || 3); }
  else { sql += " LIMIT 3"; }

  const ads = db.prepare(sql).all(...params);
  // Increment impressions
  ads.forEach(ad => {
    db.prepare("UPDATE ads SET impressions = impressions + 1 WHERE id = ?").run(ad.id);
  });
  res.json(ads);
});

// Зар дарсан (click tracking)
router.post("/:id/click", (req, res) => {
  db.prepare("UPDATE ads SET clicks = clicks + 1 WHERE id = ?").run(req.params.id);
  const ad = db.prepare("SELECT * FROM ads WHERE id = ?").get(req.params.id);
  res.json({ ok: true, link_url: ad?.link_url });
});

// Зар нэмэх (admin)
router.post("/create", (req, res) => {
  const { title, description, image_url, link_url, advertiser, placement, category, priority, end_date } = req.body;
  const result = db.prepare("INSERT INTO ads (title, description, image_url, link_url, advertiser, placement, category, priority, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(title, description || "", image_url || "", link_url || "", advertiser || "", placement || "home", category || "general", priority || 0, end_date || "");
  const ad = db.prepare("SELECT * FROM ads WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(ad);
});

// Статистик
router.get("/stats", (req, res) => {
  const stats = db.prepare("SELECT id, title, advertiser, clicks, impressions, ROUND(clicks * 100.0 / MAX(impressions, 1), 1) as ctr FROM ads ORDER BY impressions DESC").all();
  res.json(stats);
});

module.exports = router;
