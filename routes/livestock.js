const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Бүх route-д нэвтрэлт шалгах
router.use(verifyToken);

const getByUser = db.prepare("SELECT * FROM livestock WHERE user_id = ?");
const getOne = db.prepare("SELECT * FROM livestock WHERE user_id = ? AND animal_type = ?");
const insert = db.prepare("INSERT INTO livestock (user_id, animal_type, total_count) VALUES (?, ?, ?)");
const update = db.prepare("UPDATE livestock SET total_count = ?, updated_at = datetime('now') WHERE user_id = ? AND animal_type = ?");
const insertEvent = db.prepare("INSERT INTO livestock_events (user_id, animal_type, event_type, quantity, note) VALUES (?, ?, ?, ?, ?)");
const getEvents = db.prepare("SELECT * FROM livestock_events WHERE user_id = ? ORDER BY event_date DESC");

router.get("/:user_id", (req, res) => {
  res.json(getByUser.all(req.params.user_id));
});

router.post("/add", (req, res) => {
  const { user_id, animal_type, total_count } = req.body;
  const existing = getOne.get(user_id, animal_type);
  if (existing) {
    update.run(total_count, user_id, animal_type);
    const updated = getOne.get(user_id, animal_type);
    return res.json(updated);
  }
  const result = insert.run(user_id, animal_type, total_count);
  const item = db.prepare("SELECT * FROM livestock WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.post("/event", (req, res) => {
  const { user_id, animal_type, event_type, quantity, note } = req.body;
  const result = insertEvent.run(user_id, animal_type, event_type, quantity, note || "");
  const event = db.prepare("SELECT * FROM livestock_events WHERE id = ?").get(result.lastInsertRowid);

  // Update livestock count
  const animal = getOne.get(user_id, animal_type);
  if (animal) {
    let newCount = animal.total_count;
    if (event_type === "birth" || event_type === "purchased") newCount += quantity;
    if (event_type === "death" || event_type === "sold") newCount = Math.max(0, newCount - quantity);
    update.run(newCount, user_id, animal_type);
  }
  res.status(201).json(event);
});

router.get("/events/:user_id", (req, res) => {
  res.json(getEvents.all(req.params.user_id));
});

router.get("/stats/:user_id", (req, res) => {
  const userLivestock = getByUser.all(req.params.user_id);
  const total = userLivestock.reduce((s, l) => s + l.total_count, 0);
  res.json({ livestock: userLivestock, total_animals: total });
});

module.exports = router;
