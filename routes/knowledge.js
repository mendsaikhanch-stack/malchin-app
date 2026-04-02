const express = require("express");
const router = express.Router();
const db = require("../db");

// Бүх мэдлэг
router.get("/", (req, res) => {
  const { category, animal_type, season } = req.query;
  let sql = "SELECT * FROM traditional_knowledge WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  if (animal_type) { sql += " AND (animal_type = ? OR animal_type = '')"; params.push(animal_type); }
  if (season) { sql += " AND (season = ? OR season = '')"; params.push(season); }
  sql += " ORDER BY category, title";
  res.json(db.prepare(sql).all(...params));
});

// Категориуд
router.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT DISTINCT category, COUNT(*) as count FROM traditional_knowledge GROUP BY category").all());
});

// Өдрийн зөвлөгөө (random)
router.get("/daily-tip", (req, res) => {
  const all = db.prepare("SELECT * FROM traditional_knowledge").all();
  if (all.length === 0) return res.json({ tip: null });
  // Day-based random (same tip all day)
  const dayIndex = Math.floor(Date.now() / 86400000) % all.length;
  res.json({ tip: all[dayIndex] });
});

// Хайлт
router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const results = db.prepare("SELECT * FROM traditional_knowledge WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?").all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(results);
});

module.exports = router;
