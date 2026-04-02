const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const { category } = req.query;
  let sql = "SELECT * FROM shinjikh WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  sql += " ORDER BY category, id";
  res.json(db.prepare(sql).all(...params));
});

router.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT DISTINCT category, COUNT(*) as count FROM shinjikh GROUP BY category").all());
});

router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  res.json(db.prepare("SELECT * FROM shinjikh WHERE title LIKE ? OR content LIKE ? OR details LIKE ? OR tags LIKE ?")
    .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`));
});

module.exports = router;
