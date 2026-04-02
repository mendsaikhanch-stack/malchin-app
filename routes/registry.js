const express = require("express");
const router = express.Router();
const db = require("../db");

// === МАЛ ЧИП ===
router.get("/chips/:user_id", (req, res) => {
  res.json(db.prepare("SELECT * FROM animal_chips WHERE user_id = ? ORDER BY registered_at DESC").all(req.params.user_id));
});
router.post("/chips/register", (req, res) => {
  const { user_id, chip_id, animal_type, animal_name, breed, gender, birth_date, color, weight, location, notes } = req.body;
  const result = db.prepare("INSERT INTO animal_chips (user_id, chip_id, animal_type, animal_name, breed, gender, birth_date, color, weight, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(user_id, chip_id, animal_type, animal_name || "", breed || "", gender || "", birth_date || "", color || "", weight || 0, location || "", notes || "");
  res.status(201).json(db.prepare("SELECT * FROM animal_chips WHERE id = ?").get(result.lastInsertRowid));
});
router.get("/chips/lookup/:chip_id", (req, res) => {
  const chip = db.prepare("SELECT * FROM animal_chips WHERE chip_id = ?").get(req.params.chip_id);
  if (!chip) return res.status(404).json({ error: "Чип олдсонгүй" });
  res.json(chip);
});

// === ХУДАГ ===
router.get("/wells/:user_id", (req, res) => {
  res.json(db.prepare("SELECT * FROM wells WHERE user_id = ? ORDER BY registered_at DESC").all(req.params.user_id));
});
router.post("/wells/register", (req, res) => {
  const { user_id, name, type, depth, lat, lng, water_quality, capacity } = req.body;
  const result = db.prepare("INSERT INTO wells (user_id, name, type, depth, lat, lng, water_quality, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(user_id, name, type || "hand", depth || 0, lat || 0, lng || 0, water_quality || "", capacity || "");
  res.status(201).json(db.prepare("SELECT * FROM wells WHERE id = ?").get(result.lastInsertRowid));
});

// === ГАЗАР, ӨВӨЛЖӨӨ ===
router.get("/land/:user_id", (req, res) => {
  res.json(db.prepare("SELECT * FROM land_registry WHERE user_id = ? ORDER BY registered_at DESC").all(req.params.user_id));
});
router.post("/land/register", (req, res) => {
  const { user_id, type, name, certificate_no, area, area_unit, lat, lng, aimag, sum, description } = req.body;
  const result = db.prepare("INSERT INTO land_registry (user_id, type, name, certificate_no, area, area_unit, lat, lng, aimag, sum, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(user_id, type, name, certificate_no || "", area || 0, area_unit || "га", lat || 0, lng || 0, aimag || "", sum || "", description || "");
  res.status(201).json(db.prepare("SELECT * FROM land_registry WHERE id = ?").get(result.lastInsertRowid));
});

// === ЗААВАРУУД ===
router.get("/guides", (req, res) => {
  const { category } = req.query;
  let sql = "SELECT id, category, title, summary, estimated_cost, duration, season, emoji, tags FROM guides WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  sql += " ORDER BY category, title";
  res.json(db.prepare(sql).all(...params));
});
router.get("/guides/:id", (req, res) => {
  const guide = db.prepare("SELECT * FROM guides WHERE id = ?").get(req.params.id);
  if (!guide) return res.status(404).json({ error: "Заавар олдсонгүй" });
  res.json(guide);
});

// === ТОЙМ ===
router.get("/summary/:user_id", (req, res) => {
  const chips = db.prepare("SELECT COUNT(*) as cnt FROM animal_chips WHERE user_id = ?").get(req.params.user_id);
  const wells = db.prepare("SELECT COUNT(*) as cnt FROM wells WHERE user_id = ?").get(req.params.user_id);
  const lands = db.prepare("SELECT COUNT(*) as cnt FROM land_registry WHERE user_id = ?").get(req.params.user_id);
  const reminders = db.prepare("SELECT COUNT(*) as cnt FROM reminders WHERE user_id = ? AND is_completed = 0 AND due_date <= date('now', '+7 days')").get(req.params.user_id);
  res.json({ chips: chips.cnt, wells: wells.cnt, lands: lands.cnt, upcoming_reminders: reminders.cnt });
});

module.exports = router;
