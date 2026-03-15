const express = require("express");
const router = express.Router();
const users = [];
let nextId = 1;
router.get("/", (req, res) => { res.json(users); });
router.post("/create", (req, res) => { const { phone, name, aimag, sum, bag } = req.body; const user = { id: nextId++, phone, name, aimag, sum, bag, created_at: new Date() }; users.push(user); res.status(201).json(user); });
router.post("/login", (req, res) => { const user = users.find(u => u.phone === req.body.phone); if (!user) return res.status(404).json({ error: "Олдсонгүй" }); res.json(user); });
module.exports = router;
