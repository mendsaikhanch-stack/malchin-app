const express = require("express");
const router = express.Router();
const requests = [
  { id: 1, user_id: 1, from_location: "Архангай, Батцэнгэл", to_location: "Улаанбаатар", animal_type: "sheep", quantity: 100, price_offer: 500000, status: "pending", created_at: "2026-03-14", contact: "99112233" },
  { id: 2, user_id: 1, from_location: "Хөвсгөл, Мөрөн", to_location: "Дархан", animal_type: "cattle", quantity: 20, price_offer: 800000, status: "pending", created_at: "2026-03-13", contact: "99445566" }
];
const drivers = [
  { id: 1, name: "Болдоо", phone: "95001122", truck_type: "Камаз", capacity: "150 хонь / 30 үхэр", region: "Архангай, Төв, УБ", rating: 4.8 },
  { id: 2, name: "Тулга", phone: "95003344", truck_type: "ЗИЛ", capacity: "80 хонь / 15 үхэр", region: "Хөвсгөл, Булган, Дархан", rating: 4.5 },
  { id: 3, name: "Ганаа", phone: "95005566", truck_type: "Хёндай", capacity: "200 хонь / 40 үхэр", region: "Өмнөговь, Дундговь, УБ", rating: 4.9 }
];
let nextId = 3;
router.get("/", (req, res) => { res.json(requests); });
router.get("/drivers", (req, res) => { const { region } = req.query; if (region) return res.json(drivers.filter(d => d.region.toLowerCase().includes(region.toLowerCase()))); res.json(drivers); });
router.post("/request", (req, res) => { const { user_id, from_location, to_location, animal_type, quantity, price_offer, contact } = req.body; const r = { id: nextId++, user_id, from_location, to_location, animal_type, quantity, price_offer, contact, status: "pending", created_at: new Date() }; requests.push(r); res.status(201).json(r); });
router.put("/:id/status", (req, res) => { const r = requests.find(t => t.id == req.params.id); if (!r) return res.status(404).json({ error: "Олдсонгүй" }); r.status = req.body.status; res.json(r); });
router.get("/estimate", (req, res) => { const { from, to, quantity, animal_type } = req.query; const distances = { "Архангай-Улаанбаатар": 460, "Хөвсгөл-Улаанбаатар": 680, "Өмнөговь-Улаанбаатар": 550, "Төв-Улаанбаатар": 50, "Дорнод-Улаанбаатар": 600, "Ховд-Улаанбаатар": 1400 }; const key = (from || "") + "-" + (to || ""); const dist = distances[key] || 500; const pricePerKm = animal_type === "cattle" ? 1500 : 800; const base = dist * pricePerKm; const total = Math.round(base * (1 + (parseInt(quantity) || 50) / 200)); res.json({ from, to, distance_km: dist, animal_type, quantity: parseInt(quantity) || 50, estimated_price: total, currency: "MNT" }); });
module.exports = router;