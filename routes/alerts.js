const express = require("express");
const router = express.Router();
const alerts = [{ id: 1, region: "Архангай", type: "wolf", title: "Чоно үзэгдсэн", description: "Батцэнгэл суманд 3 чоно үзэгдсэн", severity: "orange" }, { id: 2, region: "Хөвсгөл", type: "dzud", title: "Цас их ороно", description: "3 хоногт 20см цас орно", severity: "yellow" }, { id: 3, region: "Дорнод", type: "disease", title: "Шүлхий өвчин", description: "Хэрлэн суманд шүлхий өвчин илэрсэн", severity: "red" }];
let nid = 4;
router.get("/", (req, res) => { const { region, type } = req.query; let r = alerts; if (region) r = r.filter(a => a.region.toLowerCase().includes(region.toLowerCase())); if (type) r = r.filter(a => a.type === type); res.json(r); });
router.post("/create", (req, res) => { const a = { id: nid++, ...req.body, created_at: new Date() }; alerts.push(a); res.status(201).json(a); });
module.exports = router;