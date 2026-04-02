const express = require("express");
const router = express.Router();
const db = require("../db");

// Малын мах, амьд мал, сүүн бүтээгдэхүүний ханш
router.get("/market", (req, res) => {
  const { aimag, item_type, market } = req.query;
  let sql = "SELECT * FROM market_prices WHERE 1=1";
  const params = [];
  if (aimag) { sql += " AND aimag = ?"; params.push(aimag); }
  if (item_type) { sql += " AND item_type = ?"; params.push(item_type); }
  if (market) { sql += " AND market_name LIKE ?"; params.push(`%${market}%`); }
  sql += " ORDER BY aimag, market_name, item_name";
  res.json(db.prepare(sql).all(...params));
});

// Аймгуудын жагсаалт (ханш бүхий)
router.get("/regions", (req, res) => {
  const regions = db.prepare("SELECT DISTINCT aimag, COUNT(*) as item_count FROM market_prices GROUP BY aimag ORDER BY aimag").all();
  res.json(regions);
});

// Захуудын жагсаалт
router.get("/markets", (req, res) => {
  const { aimag } = req.query;
  let sql = "SELECT DISTINCT market_name, aimag, location FROM market_prices";
  const params = [];
  if (aimag) { sql += " WHERE aimag = ?"; params.push(aimag); }
  sql += " ORDER BY aimag, market_name";
  res.json(db.prepare(sql).all(...params));
});

// Түүхий эдийн ханш
router.get("/raw-materials", (req, res) => {
  const { type, location } = req.query;
  let sql = "SELECT * FROM raw_material_prices WHERE 1=1";
  const params = [];
  if (type) { sql += " AND material_type = ?"; params.push(type); }
  if (location) { sql += " AND location LIKE ?"; params.push(`%${location}%`); }
  sql += " ORDER BY material_type, material_name, grade";
  res.json(db.prepare(sql).all(...params));
});

// Тойм: дундаж ханш, өсөлт/бууралт
router.get("/summary", (req, res) => {
  // Хамгийн эрэлттэй бараа
  const topDemand = db.prepare("SELECT item_name, aimag, retail_price, prev_price, demand FROM market_prices WHERE demand = 'high' ORDER BY retail_price DESC LIMIT 5").all();

  // Үнэ өссөн бараа
  const priceUp = db.prepare("SELECT item_name, aimag, market_name, retail_price, prev_price, ROUND((retail_price - prev_price) * 100.0 / prev_price, 1) as change_pct FROM market_prices WHERE retail_price > prev_price ORDER BY change_pct DESC LIMIT 5").all();

  // Үнэ буурсан бараа
  const priceDown = db.prepare("SELECT item_name, aimag, market_name, retail_price, prev_price, ROUND((retail_price - prev_price) * 100.0 / prev_price, 1) as change_pct FROM market_prices WHERE retail_price < prev_price ORDER BY change_pct ASC LIMIT 5").all();

  // Нийлүүлэлт бага
  const lowSupply = db.prepare("SELECT item_name, aimag, retail_price, supply FROM market_prices WHERE supply = 'low'").all();

  // Түүхий эд - эрэлт өндөр
  const rawDemand = db.prepare("SELECT material_name, grade, price, prev_price, demand, buyer FROM raw_material_prices WHERE demand = 'high' ORDER BY price DESC LIMIT 5").all();

  res.json({ topDemand, priceUp, priceDown, lowSupply, rawDemand });
});

module.exports = router;
