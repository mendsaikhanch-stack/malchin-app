const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

const getByUser = db.prepare("SELECT * FROM finance_records WHERE user_id = ? ORDER BY record_date DESC");
const insert = db.prepare("INSERT INTO finance_records (user_id, type, category, amount, note) VALUES (?, ?, ?, ?, ?)");

// Бүх route-д нэвтрэлт шалгах
router.use(verifyToken);

router.get("/:user_id", (req, res) => {
  res.json(getByUser.all(req.params.user_id));
});

router.post("/add", (req, res) => {
  const { user_id, type, category, amount, note } = req.body;
  const result = insert.run(user_id, type, category || "", amount, note || "");
  const item = db.prepare("SELECT * FROM finance_records WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.get("/summary/:user_id", (req, res) => {
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM finance_records WHERE user_id = ? AND type = 'income'").get(req.params.user_id);
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM finance_records WHERE user_id = ? AND type = 'expense'").get(req.params.user_id);
  res.json({ total_income: income.total, total_expense: expense.total, profit: income.total - expense.total });
});

module.exports = router;
