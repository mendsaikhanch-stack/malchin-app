const express = require("express");
const router = express.Router();
const db = require("../db");

// Хэрэглэгчийн сануулгууд
router.get("/:user_id", (req, res) => {
  const { type, upcoming } = req.query;
  let sql = "SELECT * FROM reminders WHERE user_id = ? AND is_completed = 0";
  const params = [req.params.user_id];
  if (type) { sql += " AND type = ?"; params.push(type); }
  if (upcoming === "1") {
    sql += " AND due_date >= date('now') AND due_date <= date('now', '+7 days')";
  }
  sql += " ORDER BY due_date ASC";
  res.json(db.prepare(sql).all(...params));
});

// Сануулга нэмэх
router.post("/create", (req, res) => {
  const { user_id, type, title, description, due_date, repeat_type, amount, category } = req.body;
  const result = db.prepare("INSERT INTO reminders (user_id, type, title, description, due_date, repeat_type, amount, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(user_id, type, title, description || "", due_date, repeat_type || "none", amount || 0, category || "");
  res.status(201).json(db.prepare("SELECT * FROM reminders WHERE id = ?").get(result.lastInsertRowid));
});

// Биелүүлсэн
router.put("/:id/complete", (req, res) => {
  db.prepare("UPDATE reminders SET is_completed = 1 WHERE id = ?").run(req.params.id);
  // Давтагдах бол шинэ сануулга үүсгэх
  const reminder = db.prepare("SELECT * FROM reminders WHERE id = ?").get(req.params.id);
  if (reminder && reminder.repeat_type !== 'none') {
    const intervals = { daily: '+1 day', weekly: '+7 days', monthly: '+1 month', '3_months': '+3 months', '6_months': '+6 months', yearly: '+1 year' };
    const interval = intervals[reminder.repeat_type];
    if (interval) {
      db.prepare("INSERT INTO reminders (user_id, type, title, description, due_date, repeat_type, amount, category) VALUES (?, ?, ?, ?, date(?, ?), ?, ?, ?)")
        .run(reminder.user_id, reminder.type, reminder.title, reminder.description, reminder.due_date, interval, reminder.repeat_type, reminder.amount, reminder.category);
    }
  }
  res.json({ ok: true });
});

// Устгах
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM reminders WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Вакцины хуваарь
router.get("/vaccines/schedule", (req, res) => {
  const { animal_type } = req.query;
  let sql = "SELECT * FROM vaccination_schedule WHERE 1=1";
  const params = [];
  if (animal_type) { sql += " AND animal_type = ?"; params.push(animal_type); }
  sql += " ORDER BY animal_type, recommended_month";
  res.json(db.prepare(sql).all(...params));
});

// Өнөөдрийн сануулгууд (бүх хэрэглэгчийн)
router.get("/today/all", (req, res) => {
  const today = db.prepare("SELECT * FROM reminders WHERE is_completed = 0 AND due_date <= date('now') ORDER BY due_date ASC").all();
  res.json(today);
});

module.exports = router;
