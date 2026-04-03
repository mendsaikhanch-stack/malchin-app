const express = require("express");
const router = express.Router();
const db = require("../db");

// ============ ADMIN AUTH ============
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "malchin2024";

router.post("/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ ok: true, token: Buffer.from("admin:" + Date.now()).toString("base64") });
  } else {
    res.status(401).json({ error: "Нууц үг буруу" });
  }
});

// ============ DASHBOARD STATS ============
router.get("/stats", (req, res) => {
  const users = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  const livestock = db.prepare("SELECT COALESCE(SUM(total_count),0) as count FROM livestock").get().count;
  const marketListings = db.prepare("SELECT COUNT(*) as count FROM market_listings WHERE status='active'").get().count;
  const alerts = db.prepare("SELECT COUNT(*) as count FROM alerts").get().count;
  const news = db.prepare("SELECT COUNT(*) as count FROM news").get().count;
  const ads = db.prepare("SELECT COUNT(*) as count FROM ads WHERE is_active=1").get().count;
  const drivers = db.prepare("SELECT COUNT(*) as count FROM drivers").get().count;
  const programs = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status='active'").get().count;
  const totalClicks = db.prepare("SELECT COALESCE(SUM(clicks),0) as count FROM ads").get().count;
  const totalImpressions = db.prepare("SELECT COALESCE(SUM(impressions),0) as count FROM ads").get().count;
  res.json({ users, livestock, marketListings, alerts, news, ads, drivers, programs, totalClicks, totalImpressions });
});

// ============ USERS ============
router.get("/users", (req, res) => {
  res.json(db.prepare("SELECT * FROM users ORDER BY created_at DESC").all());
});

router.put("/users/:id", (req, res) => {
  const { name, phone, aimag, sum, bag } = req.body;
  db.prepare("UPDATE users SET name=?, phone=?, aimag=?, sum=?, bag=? WHERE id=?").run(name, phone, aimag || "", sum || "", bag || "", req.params.id);
  res.json(db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id));
});

router.delete("/users/:id", (req, res) => {
  db.prepare("DELETE FROM users WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ ALERTS ============
router.get("/alerts", (req, res) => {
  res.json(db.prepare("SELECT * FROM alerts ORDER BY created_at DESC").all());
});

router.post("/alerts", (req, res) => {
  const { region, type, title, description, severity } = req.body;
  const result = db.prepare("INSERT INTO alerts (region, type, title, description, severity) VALUES (?,?,?,?,?)").run(region, type, title, description || "", severity || "yellow");
  res.status(201).json(db.prepare("SELECT * FROM alerts WHERE id=?").get(result.lastInsertRowid));
});

router.put("/alerts/:id", (req, res) => {
  const { region, type, title, description, severity } = req.body;
  db.prepare("UPDATE alerts SET region=?, type=?, title=?, description=?, severity=? WHERE id=?").run(region, type, title, description || "", severity || "yellow", req.params.id);
  res.json(db.prepare("SELECT * FROM alerts WHERE id=?").get(req.params.id));
});

router.delete("/alerts/:id", (req, res) => {
  db.prepare("DELETE FROM alerts WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ NEWS ============
router.get("/news", (req, res) => {
  res.json(db.prepare("SELECT * FROM news ORDER BY published_at DESC").all());
});

router.post("/news", (req, res) => {
  const { category, title, summary, body, source, source_url, image_url, region, tags, is_urgent } = req.body;
  const result = db.prepare("INSERT INTO news (category, title, summary, body, source, source_url, image_url, region, tags, is_urgent) VALUES (?,?,?,?,?,?,?,?,?,?)").run(category, title, summary || "", body || "", source || "", source_url || "", image_url || "", region || "", tags || "", is_urgent || 0);
  res.status(201).json(db.prepare("SELECT * FROM news WHERE id=?").get(result.lastInsertRowid));
});

router.put("/news/:id", (req, res) => {
  const { category, title, summary, body, source, source_url, image_url, region, tags, is_urgent } = req.body;
  db.prepare("UPDATE news SET category=?, title=?, summary=?, body=?, source=?, source_url=?, image_url=?, region=?, tags=?, is_urgent=? WHERE id=?").run(category, title, summary || "", body || "", source || "", source_url || "", image_url || "", region || "", tags || "", is_urgent || 0, req.params.id);
  res.json(db.prepare("SELECT * FROM news WHERE id=?").get(req.params.id));
});

router.delete("/news/:id", (req, res) => {
  db.prepare("DELETE FROM news WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ MARKET LISTINGS ============
router.get("/market", (req, res) => {
  res.json(db.prepare("SELECT m.*, u.name as user_name FROM market_listings m LEFT JOIN users u ON m.user_id=u.id ORDER BY m.created_at DESC").all());
});

router.put("/market/:id", (req, res) => {
  const { title, description, category, animal_type, quantity, price, location, status } = req.body;
  db.prepare("UPDATE market_listings SET title=?, description=?, category=?, animal_type=?, quantity=?, price=?, location=?, status=? WHERE id=?").run(title, description || "", category || "livestock", animal_type || "", quantity || 0, price || 0, location || "", status || "active", req.params.id);
  res.json(db.prepare("SELECT * FROM market_listings WHERE id=?").get(req.params.id));
});

router.delete("/market/:id", (req, res) => {
  db.prepare("DELETE FROM market_listings WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ ADS ============
router.get("/ads", (req, res) => {
  res.json(db.prepare("SELECT * FROM ads ORDER BY created_at DESC").all());
});

router.post("/ads", (req, res) => {
  const { title, description, image_url, link_url, advertiser, placement, category, priority, end_date } = req.body;
  const result = db.prepare("INSERT INTO ads (title, description, image_url, link_url, advertiser, placement, category, priority, end_date) VALUES (?,?,?,?,?,?,?,?,?)").run(title, description || "", image_url || "", link_url || "", advertiser || "", placement || "home", category || "general", priority || 0, end_date || "");
  res.status(201).json(db.prepare("SELECT * FROM ads WHERE id=?").get(result.lastInsertRowid));
});

router.put("/ads/:id", (req, res) => {
  const { title, description, image_url, link_url, advertiser, placement, category, priority, is_active, end_date } = req.body;
  db.prepare("UPDATE ads SET title=?, description=?, image_url=?, link_url=?, advertiser=?, placement=?, category=?, priority=?, is_active=?, end_date=? WHERE id=?").run(title, description || "", image_url || "", link_url || "", advertiser || "", placement || "home", category || "general", priority || 0, is_active ?? 1, end_date || "", req.params.id);
  res.json(db.prepare("SELECT * FROM ads WHERE id=?").get(req.params.id));
});

router.delete("/ads/:id", (req, res) => {
  db.prepare("DELETE FROM ads WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ DRIVERS ============
router.get("/drivers", (req, res) => {
  res.json(db.prepare("SELECT * FROM drivers ORDER BY rating DESC").all());
});

router.post("/drivers", (req, res) => {
  const { name, phone, truck_type, capacity, region, rating } = req.body;
  const result = db.prepare("INSERT INTO drivers (name, phone, truck_type, capacity, region, rating) VALUES (?,?,?,?,?,?)").run(name, phone, truck_type || "", capacity || "", region || "", rating || 0);
  res.status(201).json(db.prepare("SELECT * FROM drivers WHERE id=?").get(result.lastInsertRowid));
});

router.put("/drivers/:id", (req, res) => {
  const { name, phone, truck_type, capacity, region, rating } = req.body;
  db.prepare("UPDATE drivers SET name=?, phone=?, truck_type=?, capacity=?, region=?, rating=? WHERE id=?").run(name, phone, truck_type || "", capacity || "", region || "", rating || 0, req.params.id);
  res.json(db.prepare("SELECT * FROM drivers WHERE id=?").get(req.params.id));
});

router.delete("/drivers/:id", (req, res) => {
  db.prepare("DELETE FROM drivers WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ PROGRAMS ============
router.get("/programs", (req, res) => {
  res.json(db.prepare("SELECT * FROM programs ORDER BY deadline ASC").all());
});

router.post("/programs", (req, res) => {
  const { category, title, description, organization, eligibility, amount, deadline, contact, region, status } = req.body;
  const result = db.prepare("INSERT INTO programs (category, title, description, organization, eligibility, amount, deadline, contact, region, status) VALUES (?,?,?,?,?,?,?,?,?,?)").run(category, title, description || "", organization || "", eligibility || "", amount || "", deadline || "", contact || "", region || "", status || "active");
  res.status(201).json(db.prepare("SELECT * FROM programs WHERE id=?").get(result.lastInsertRowid));
});

router.put("/programs/:id", (req, res) => {
  const { category, title, description, organization, eligibility, amount, deadline, contact, region, status } = req.body;
  db.prepare("UPDATE programs SET category=?, title=?, description=?, organization=?, eligibility=?, amount=?, deadline=?, contact=?, region=?, status=? WHERE id=?").run(category, title, description || "", organization || "", eligibility || "", amount || "", deadline || "", contact || "", region || "", status || "active", req.params.id);
  res.json(db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id));
});

router.delete("/programs/:id", (req, res) => {
  db.prepare("DELETE FROM programs WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ MARKET PRICES ============
router.get("/market-prices", (req, res) => {
  res.json(db.prepare("SELECT * FROM market_prices ORDER BY market_name, item_type, item_name").all());
});

router.post("/market-prices", (req, res) => {
  const { market_name, aimag, location, item_type, item_name, unit, wholesale_price, retail_price, prev_price, supply, demand } = req.body;
  const result = db.prepare("INSERT INTO market_prices (market_name, aimag, location, item_type, item_name, unit, wholesale_price, retail_price, prev_price, supply, demand) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(market_name, aimag, location || "", item_type, item_name, unit, wholesale_price || 0, retail_price || 0, prev_price || 0, supply || "normal", demand || "normal");
  res.status(201).json(db.prepare("SELECT * FROM market_prices WHERE id=?").get(result.lastInsertRowid));
});

router.put("/market-prices/:id", (req, res) => {
  const { market_name, aimag, location, item_type, item_name, unit, wholesale_price, retail_price, prev_price, supply, demand } = req.body;
  db.prepare("UPDATE market_prices SET market_name=?, aimag=?, location=?, item_type=?, item_name=?, unit=?, wholesale_price=?, retail_price=?, prev_price=?, supply=?, demand=?, updated_at=datetime('now') WHERE id=?").run(market_name, aimag, location || "", item_type, item_name, unit, wholesale_price || 0, retail_price || 0, prev_price || 0, supply || "normal", demand || "normal", req.params.id);
  res.json(db.prepare("SELECT * FROM market_prices WHERE id=?").get(req.params.id));
});

router.delete("/market-prices/:id", (req, res) => {
  db.prepare("DELETE FROM market_prices WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ RAW MATERIAL PRICES ============
router.get("/raw-prices", (req, res) => {
  res.json(db.prepare("SELECT * FROM raw_material_prices ORDER BY material_type, material_name").all());
});

router.post("/raw-prices", (req, res) => {
  const { material_type, material_name, grade, unit, price, prev_price, buyer, location, supply, demand } = req.body;
  const result = db.prepare("INSERT INTO raw_material_prices (material_type, material_name, grade, unit, price, prev_price, buyer, location, supply, demand) VALUES (?,?,?,?,?,?,?,?,?,?)").run(material_type, material_name, grade || "", unit, price || 0, prev_price || 0, buyer || "", location || "", supply || "normal", demand || "normal");
  res.status(201).json(db.prepare("SELECT * FROM raw_material_prices WHERE id=?").get(result.lastInsertRowid));
});

router.put("/raw-prices/:id", (req, res) => {
  const { material_type, material_name, grade, unit, price, prev_price, buyer, location, supply, demand } = req.body;
  db.prepare("UPDATE raw_material_prices SET material_type=?, material_name=?, grade=?, unit=?, price=?, prev_price=?, buyer=?, location=?, supply=?, demand=?, updated_at=datetime('now') WHERE id=?").run(material_type, material_name, grade || "", unit, price || 0, prev_price || 0, buyer || "", location || "", supply || "normal", demand || "normal", req.params.id);
  res.json(db.prepare("SELECT * FROM raw_material_prices WHERE id=?").get(req.params.id));
});

router.delete("/raw-prices/:id", (req, res) => {
  db.prepare("DELETE FROM raw_material_prices WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ============ LIVESTOCK (admin view) ============
router.get("/livestock", (req, res) => {
  res.json(db.prepare("SELECT l.*, u.name as user_name FROM livestock l LEFT JOIN users u ON l.user_id=u.id ORDER BY u.name, l.animal_type").all());
});

// ============ FINANCE (admin view) ============
router.get("/finance", (req, res) => {
  res.json(db.prepare("SELECT f.*, u.name as user_name FROM finance_records f LEFT JOIN users u ON f.user_id=u.id ORDER BY f.record_date DESC LIMIT 200").all());
});

module.exports = router;
