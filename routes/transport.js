const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM transport_requests ORDER BY created_at DESC").all());
});

router.get("/drivers", (req, res) => {
  const { region } = req.query;
  if (region) {
    return res.json(db.prepare("SELECT * FROM drivers WHERE region LIKE ?").all(`%${region}%`));
  }
  res.json(db.prepare("SELECT * FROM drivers").all());
});

router.post("/request", (req, res) => {
  const { user_id, from_location, to_location, animal_type, quantity, price_offer, contact } = req.body;
  const result = db.prepare("INSERT INTO transport_requests (user_id, from_location, to_location, animal_type, quantity, price_offer, contact) VALUES (?, ?, ?, ?, ?, ?, ?)").run(user_id, from_location, to_location, animal_type || "", quantity || 0, price_offer || 0, contact || "");
  const item = db.prepare("SELECT * FROM transport_requests WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put("/:id/status", (req, res) => {
  const result = db.prepare("UPDATE transport_requests SET status = ? WHERE id = ?").run(req.body.status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Олдсонгүй" });
  const item = db.prepare("SELECT * FROM transport_requests WHERE id = ?").get(req.params.id);
  res.json(item);
});

router.get("/estimate", (req, res) => {
  const { from, to, quantity, animal_type } = req.query;
  const distances = { "Архангай-Улаанбаатар": 460, "Хөвсгөл-Улаанбаатар": 680, "Өмнөговь-Улаанбаатар": 550, "Төв-Улаанбаатар": 50, "Дорнод-Улаанбаатар": 600, "Ховд-Улаанбаатар": 1400 };
  const key = (from || "") + "-" + (to || "");
  const dist = distances[key] || 500;
  const pricePerKm = animal_type === "cattle" ? 1500 : 800;
  const base = dist * pricePerKm;
  const total = Math.round(base * (1 + (parseInt(quantity) || 50) / 200));
  res.json({ from, to, distance_km: dist, animal_type, quantity: parseInt(quantity) || 50, estimated_price: total, currency: "MNT" });
});

module.exports = router;
