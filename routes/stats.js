const express = require("express");
const router = express.Router();
const db = require("../db");

// Бүх статистик
router.get("/", (req, res) => {
  const { category } = req.query;
  let sql = "SELECT * FROM national_stats WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  sql += " ORDER BY category, value DESC";
  res.json(db.prepare(sql).all(...params));
});

// Тойм
router.get("/summary", (req, res) => {
  const total = db.prepare("SELECT * FROM national_stats WHERE category = 'livestock_total'").all();
  const byType = db.prepare("SELECT * FROM national_stats WHERE category = 'livestock_type' ORDER BY value DESC").all();
  const byRegion = db.prepare("SELECT * FROM national_stats WHERE category = 'livestock_region' ORDER BY value DESC").all();
  const exports = db.prepare("SELECT * FROM national_stats WHERE category = 'export'").all();
  const herder = db.prepare("SELECT * FROM national_stats WHERE category = 'herder'").all();
  const dzud = db.prepare("SELECT * FROM national_stats WHERE category = 'dzud'").all();
  res.json({ total, byType, byRegion, exports, herder, dzud });
});

module.exports = router;
