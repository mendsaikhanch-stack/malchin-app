const express = require("express");
const router = express.Router();
const listings = [];
let nextId = 1;
router.get("/", (req, res) => { res.json(listings.filter(l => l.status === "active")); });
router.post("/create", (req, res) => { const { user_id, category, title, description, animal_type, quantity, price, location } = req.body; const item = { id: nextId++, user_id, category: category || "livestock", title, description, animal_type, quantity, price, location, status: "active", created_at: new Date() }; listings.push(item); res.status(201).json(item); });
router.put("/:id/status", (req, res) => { const item = listings.find(l => l.id == req.params.id); if (!item) return res.status(404).json({ error: "Олдсонгүй" }); item.status = req.body.status; res.json(item); });
module.exports = router;
