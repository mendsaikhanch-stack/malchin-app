const express = require("express");
const router = express.Router();
const alerts = [{ id: 1, region: "Arkhangai", type: "wolf", title: "Chono uzegdsen", severity: "orange" }, { id: 2, region: "Khuvsgul", type: "dzud", title: "Tsas ih orono", severity: "yellow" }];
let nid = 3;
router.get("/", (req, res) => { res.json(alerts); });
router.post("/create", (req, res) => { const a = { id: nid++, ...req.body, created_at: new Date() }; alerts.push(a); res.status(201).json(a); });
module.exports = router;