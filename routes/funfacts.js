const express = require("express");
const router = express.Router();
const db = require("../db");

// Бүх мэдээлэл
router.get("/", (req, res) => {
  const { category } = req.query;
  let sql = "SELECT * FROM fun_facts WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  sql += " ORDER BY category, id";
  res.json(db.prepare(sql).all(...params));
});

// Категори жагсаалт
router.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT DISTINCT category, COUNT(*) as count FROM fun_facts GROUP BY category ORDER BY count DESC").all());
});

// Өдрийн баримт (random, өдөрт 1)
router.get("/daily", (req, res) => {
  const all = db.prepare("SELECT * FROM fun_facts").all();
  if (all.length === 0) return res.json(null);
  const dayIndex = Math.floor(Date.now() / 86400000) % all.length;
  res.json(all[dayIndex]);
});

// Санамсаргүй 1 баримт
router.get("/random", (req, res) => {
  const all = db.prepare("SELECT * FROM fun_facts").all();
  if (all.length === 0) return res.json(null);
  res.json(all[Math.floor(Math.random() * all.length)]);
});

module.exports = router;
