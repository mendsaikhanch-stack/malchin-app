const express = require("express");
const router = express.Router();
const db = require("../db");

// Ensure phone and image_url columns exist
try {
  db.exec(`ALTER TABLE market_listings ADD COLUMN phone TEXT DEFAULT ''`);
} catch {}
try {
  db.exec(`ALTER TABLE market_listings ADD COLUMN image_url TEXT DEFAULT ''`);
} catch {}
try {
  db.exec(`ALTER TABLE market_listings ADD COLUMN contact_name TEXT DEFAULT ''`);
} catch {}
try {
  db.exec(`ALTER TABLE market_listings ADD COLUMN views INTEGER DEFAULT 0`);
} catch {}

// Бүх идэвхтэй зарууд (шүүлтүүртэй)
router.get("/", (req, res) => {
  const { animal_type, search, min_price, max_price, location, sort } = req.query;
  let sql = "SELECT * FROM market_listings WHERE status = 'active'";
  const params = [];

  if (animal_type) {
    sql += " AND animal_type = ?";
    params.push(animal_type);
  }
  if (search) {
    sql += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (min_price) {
    sql += " AND price >= ?";
    params.push(parseInt(min_price));
  }
  if (max_price) {
    sql += " AND price <= ?";
    params.push(parseInt(max_price));
  }
  if (location) {
    sql += " AND location LIKE ?";
    params.push(`%${location}%`);
  }

  if (sort === "price_asc") sql += " ORDER BY price ASC";
  else if (sort === "price_desc") sql += " ORDER BY price DESC";
  else sql += " ORDER BY created_at DESC";

  res.json(db.prepare(sql).all(...params));
});

// Нэг зарын дэлгэрэнгүй
router.get("/:id", (req, res) => {
  const item = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ error: "Зар олдсонгүй" });
  // Үзсэн тоо нэмэх
  db.prepare("UPDATE market_listings SET views = views + 1 WHERE id = ?").run(req.params.id);
  res.json(item);
});

// Хэрэглэгчийн зарууд
router.get("/user/:user_id", (req, res) => {
  const items = db.prepare(
    "SELECT * FROM market_listings WHERE user_id = ? ORDER BY created_at DESC"
  ).all(req.params.user_id);
  res.json(items);
});

// Зар нэмэх
router.post("/create", (req, res) => {
  const { user_id, category, title, description, animal_type, quantity, price, location, phone, image_url, contact_name } = req.body;
  const result = db.prepare(
    "INSERT INTO market_listings (user_id, category, title, description, animal_type, quantity, price, location, phone, image_url, contact_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    user_id, category || "livestock", title, description || "",
    animal_type || "", quantity || 0, price || 0, location || "",
    phone || "", image_url || "", contact_name || ""
  );
  const item = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Зар засах
router.put("/:id", (req, res) => {
  const { title, description, animal_type, quantity, price, location, phone, image_url, contact_name } = req.body;
  const existing = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Зар олдсонгүй" });

  db.prepare(
    `UPDATE market_listings SET
      title = ?, description = ?, animal_type = ?, quantity = ?,
      price = ?, location = ?, phone = ?, image_url = ?, contact_name = ?
    WHERE id = ?`
  ).run(
    title ?? existing.title, description ?? existing.description,
    animal_type ?? existing.animal_type, quantity ?? existing.quantity,
    price ?? existing.price, location ?? existing.location,
    phone ?? existing.phone, image_url ?? existing.image_url,
    contact_name ?? existing.contact_name, req.params.id
  );
  const item = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(req.params.id);
  res.json(item);
});

// Зарын статус өөрчлөх
router.put("/:id/status", (req, res) => {
  const result = db.prepare("UPDATE market_listings SET status = ? WHERE id = ?").run(req.body.status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Зар олдсонгүй" });
  const item = db.prepare("SELECT * FROM market_listings WHERE id = ?").get(req.params.id);
  res.json(item);
});

// Зар устгах
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM market_listings WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Зар олдсонгүй" });
  res.json({ success: true });
});

// Статистик
router.get("/stats/summary", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as cnt FROM market_listings WHERE status = 'active'").get();
  const byType = db.prepare(
    "SELECT animal_type, COUNT(*) as cnt, AVG(price) as avg_price FROM market_listings WHERE status = 'active' GROUP BY animal_type"
  ).all();
  res.json({ total_active: total.cnt, by_type: byType });
});

module.exports = router;
