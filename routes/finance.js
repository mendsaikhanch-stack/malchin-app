const express = require("express");
const router = express.Router();
const records = [];
let nextId = 1;
router.get("/:user_id", (req, res) => { res.json(records.filter(r => r.user_id == req.params.user_id)); });
router.post("/add", (req, res) => { const { user_id, type, category, amount, note } = req.body; const item = { id: nextId++, user_id, type, category, amount, note, record_date: new Date() }; records.push(item); res.status(201).json(item); });
router.get("/summary/:user_id", (req, res) => { const userRecords = records.filter(r => r.user_id == req.params.user_id); const income = userRecords.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0); const expense = userRecords.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0); res.json({ total_income: income, total_expense: expense, profit: income - expense }); });
module.exports = router;
