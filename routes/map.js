const express = require("express");
const router = express.Router();
const locations = {
  aimags: [
    { name: "Улаанбаатар", lat: 47.9214, lng: 106.9055, type: "city" },
    { name: "Архангай", lat: 47.8611, lng: 100.7236, type: "aimag" },
    { name: "Хөвсгөл", lat: 49.3892, lng: 99.7250, type: "aimag" },
    { name: "Өмнөговь", lat: 43.5711, lng: 104.4250, type: "aimag" },
    { name: "Төв", lat: 47.7131, lng: 106.9528, type: "aimag" },
    { name: "Дорнод", lat: 47.3170, lng: 115.7903, type: "aimag" },
    { name: "Ховд", lat: 48.0056, lng: 91.6428, type: "aimag" },
    { name: "Хэнтий", lat: 47.3178, lng: 109.6513, type: "aimag" },
    { name: "Баянхонгор", lat: 46.1947, lng: 100.7181, type: "aimag" },
    { name: "Завхан", lat: 48.2608, lng: 96.0703, type: "aimag" },
    { name: "Сэлэнгэ", lat: 49.8900, lng: 106.1847, type: "aimag" },
    { name: "Булган", lat: 48.8125, lng: 103.5347, type: "aimag" },
    { name: "Увс", lat: 49.9847, lng: 92.0669, type: "aimag" }
  ],
  pastures: [
    { name: "Батцэнгэл зуслан", lat: 47.95, lng: 100.80, type: "pasture", quality: "сайн", water: true },
    { name: "Мөрөн зуслан", lat: 49.45, lng: 99.78, type: "pasture", quality: "маш сайн", water: true },
    { name: "Даланзадгад бэлчээр", lat: 43.60, lng: 104.50, type: "pasture", quality: "дунд", water: false }
  ],
  services: [
    { name: "Малын эмч Бат", lat: 47.87, lng: 100.73, type: "vet", phone: "99887766", aimag: "Архангай" },
    { name: "Малын эмч Дорж", lat: 49.40, lng: 99.74, type: "vet", phone: "99665544", aimag: "Хөвсгөл" },
    { name: "Тэжээлийн дэлгүүр", lat: 47.92, lng: 106.92, type: "feed_store", phone: "77112233", aimag: "Улаанбаатар" },
    { name: "Мал ачих Болдоо", lat: 47.90, lng: 100.75, type: "transport", phone: "95001122", aimag: "Архангай" }
  ],
  markets: [
    { name: "УБ Махны зах", lat: 47.91, lng: 106.88, type: "market", products: ["мах", "арьс", "ноос"] },
    { name: "Архангай махны цэг", lat: 47.86, lng: 100.72, type: "market", products: ["мах", "ноолуур"] },
    { name: "Дархан махны үйлдвэр", lat: 49.47, lng: 106.05, type: "market", products: ["мах"] }
  ]
};
router.get("/aimags", (req, res) => { res.json(locations.aimags); });
router.get("/pastures", (req, res) => { res.json(locations.pastures); });
router.get("/services", (req, res) => { const { type, aimag } = req.query; let result = locations.services; if (type) result = result.filter(s => s.type === type); if (aimag) result = result.filter(s => s.aimag.toLowerCase().includes(aimag.toLowerCase())); res.json(result); });
router.get("/markets", (req, res) => { res.json(locations.markets); });
router.get("/nearby", (req, res) => { const { lat, lng, radius } = req.query; const la = parseFloat(lat) || 47.92; const lo = parseFloat(lng) || 106.91; const r = parseFloat(radius) || 100; const all = [...locations.services, ...locations.markets, ...locations.pastures]; const nearby = all.filter(p => { const d = Math.sqrt(Math.pow(p.lat - la, 2) + Math.pow((p.lng || p.lon) - lo, 2)) * 111; return d <= r; }); res.json(nearby); });
module.exports = router;