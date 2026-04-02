const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM market_listings WHERE status = 'active' ORDER BY created_at DESC").all());
});

router.post("/create", (req, res) => {
  const { user_id, category, title, description, animal_type, quantity, price, location } = req.body;
  const result = db.prepare("INSERT INTO market_listings (user_id, category, title, description, animal_type, quantity, price, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(user_id, category || "livestock", title, description || "", animal_type || "", quantity || 0, price || 0, location || "");
  const item = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put("/:id/status", (req, res) => {
  const result = db.prepare("UPDATE market_listings SET status = ? WHERE id = ?").run(req.body.status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Зар олдсонгүй" });
  const item = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(req.params.id);
  res.json(item);
});

module.exports = router;
