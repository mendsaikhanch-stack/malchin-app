const express = require("express");
const router = express.Router();
const db = require("../db");

// Мэдээний жагсаалт
router.get("/", (req, res) => {
  const { category, region, urgent } = req.query;
  let sql = "SELECT * FROM news WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  if (region) { sql += " AND (region = ? OR region = '')"; params.push(region); }
  if (urgent === "1") { sql += " AND is_urgent = 1"; }
  sql += " ORDER BY is_urgent DESC, published_at DESC";
  res.json(db.prepare(sql).all(...params));
});

// Хөтөлбөр, зээл, боломжууд
router.get("/programs", (req, res) => {
  const { category, status } = req.query;
  let sql = "SELECT * FROM programs WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  else { sql += " AND status = 'active'"; }
  sql += " ORDER BY deadline ASC";
  res.json(db.prepare(sql).all(...params));
});

// Олон улсын ханш
router.get("/intl-prices", (req, res) => {
  res.json(db.prepare("SELECT * FROM intl_prices ORDER BY commodity_mn").all());
});

// Тойм: яаралтай мэдээ + удахгүй дуусах хөтөлбөр + гадаад ханш
router.get("/dashboard", (req, res) => {
  const urgentNews = db.prepare("SELECT * FROM news WHERE is_urgent = 1 ORDER BY published_at DESC LIMIT 5").all();
  const latestNews = db.prepare("SELECT * FROM news ORDER BY published_at DESC LIMIT 10").all();
  const activePrograms = db.prepare("SELECT * FROM programs WHERE status = 'active' ORDER BY deadline ASC").all();
  const intlPrices = db.prepare("SELECT * FROM intl_prices ORDER BY commodity_mn").all();
  res.json({ urgentNews, latestNews, activePrograms, intlPrices });
});

module.exports = router;
