const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const { region, type } = req.query;
  let sql = "SELECT * FROM alerts WHERE 1=1";
  const params = [];
  if (region) { sql += " AND region LIKE ?"; params.push(`%${region}%`); }
  if (type) { sql += " AND type = ?"; params.push(type); }
  sql += " ORDER BY created_at DESC";
  res.json(db.prepare(sql).all(...params));
});

router.post("/create", (req, res) => {
  const { region, type, title, description, severity } = req.body;
  const result = db.prepare("INSERT INTO alerts (region, type, title, description, severity) VALUES (?, ?, ?, ?, ?)").run(region, type, title, description || "", severity || "yellow");
  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(alert);
});

module.exports = router;
