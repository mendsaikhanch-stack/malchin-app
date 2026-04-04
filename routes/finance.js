const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Бүх route-д нэвтрэлт шалгах
router.use(verifyToken);

// ==================== БҮРТГЭЛ CRUD ====================

// Бүх бүртгэлүүд (шүүлтүүртэй)
router.get("/", (req, res) => {
  const { type, category, month, year, from_date, to_date, limit, offset } = req.query;
  let sql = "SELECT * FROM finance_records WHERE user_id = ?";
  const params = [req.user.id];

  if (type && (type === "income" || type === "expense")) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (year) {
    sql += " AND strftime('%Y', record_date) = ?";
    params.push(String(year));
  }
  if (month) {
    sql += " AND strftime('%m', record_date) = ?";
    params.push(String(month).padStart(2, "0"));
  }
  if (from_date) {
    sql += " AND date(record_date) >= date(?)";
    params.push(from_date);
  }
  if (to_date) {
    sql += " AND date(record_date) <= date(?)";
    params.push(to_date);
  }

  sql += " ORDER BY record_date DESC";

  if (limit) {
    sql += " LIMIT ?";
    params.push(parseInt(limit));
    if (offset) {
      sql += " OFFSET ?";
      params.push(parseInt(offset));
    }
  }

  res.json(db.prepare(sql).all(...params));
});

// Нэг бүртгэл
router.get("/record/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM finance_records WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });
  res.json(row);
});

// Бүртгэл нэмэх
router.post("/add", (req, res) => {
  const { type, category, amount, note, record_date } = req.body;
  if (!type || !amount) return res.status(400).json({ error: "type, amount заавал шаардлагатай" });
  if (type !== "income" && type !== "expense") return res.status(400).json({ error: "type нь income эсвэл expense байх ёстой" });
  if (amount <= 0) return res.status(400).json({ error: "amount 0-ээс их байх ёстой" });

  const sql = record_date
    ? "INSERT INTO finance_records (user_id, type, category, amount, note, record_date) VALUES (?, ?, ?, ?, ?, ?)"
    : "INSERT INTO finance_records (user_id, type, category, amount, note) VALUES (?, ?, ?, ?, ?)";
  const params = record_date
    ? [req.user.id, type, category || "", amount, note || "", record_date]
    : [req.user.id, type, category || "", amount, note || ""];

  const result = db.prepare(sql).run(...params);
  const item = db.prepare("SELECT * FROM finance_records WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Бүртгэл засах
router.put("/update/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM finance_records WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });

  const { type, category, amount, note, record_date } = req.body;
  db.prepare(`
    UPDATE finance_records SET
      type = COALESCE(?, type),
      category = COALESCE(?, category),
      amount = COALESCE(?, amount),
      note = COALESCE(?, note),
      record_date = COALESCE(?, record_date)
    WHERE id = ? AND user_id = ?
  `).run(
    type || null, category !== undefined ? category : null,
    amount || null, note !== undefined ? note : null,
    record_date || null, req.params.id, req.user.id
  );

  const updated = db.prepare("SELECT * FROM finance_records WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// Бүртгэл устгах
router.delete("/delete/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM finance_records WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });

  db.prepare("DELETE FROM finance_records WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  res.json({ success: true, message: "Бүртгэл устгагдлаа" });
});

// Олон бүртгэл нэг дор устгах
router.post("/delete-batch", (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids массив шаардлагатай" });
  }

  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(
    `DELETE FROM finance_records WHERE id IN (${placeholders}) AND user_id = ?`
  ).run(...ids, req.user.id);

  res.json({ success: true, deleted: result.changes });
});

// ==================== НЭГТГЭЛ / ТАЙЛАН ====================

// Ерөнхий нэгтгэл
router.get("/summary", (req, res) => {
  const { year, month, from_date, to_date } = req.query;
  let dateFilter = "";
  const params = [req.user.id];

  if (year) {
    dateFilter += " AND strftime('%Y', record_date) = ?";
    params.push(String(year));
  }
  if (month) {
    dateFilter += " AND strftime('%m', record_date) = ?";
    params.push(String(month).padStart(2, "0"));
  }
  if (from_date) {
    dateFilter += " AND date(record_date) >= date(?)";
    params.push(from_date);
  }
  if (to_date) {
    dateFilter += " AND date(record_date) <= date(?)";
    params.push(to_date);
  }

  const income = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM finance_records WHERE user_id = ? AND type = 'income'${dateFilter}`
  ).get(...params);
  const expense = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM finance_records WHERE user_id = ? AND type = 'expense'${dateFilter}`
  ).get(...params);

  res.json({
    total_income: income.total,
    total_expense: expense.total,
    profit: income.total - expense.total,
    income_count: income.count,
    expense_count: expense.count,
    total_count: income.count + expense.count,
  });
});

// Сар бүрийн нарийвчилсан тайлан
router.get("/summary/monthly", (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  const rows = db.prepare(`
    SELECT
      CAST(strftime('%m', record_date) AS INTEGER) as month,
      type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM finance_records
    WHERE user_id = ? AND strftime('%Y', record_date) = ?
    GROUP BY month, type
    ORDER BY month
  `).all(req.user.id, String(year));

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const incRow = rows.find(r => r.month === m && r.type === "income");
    const expRow = rows.find(r => r.month === m && r.type === "expense");
    const income = incRow ? incRow.total : 0;
    const expense = expRow ? expRow.total : 0;
    months.push({
      month: m,
      income,
      expense,
      profit: income - expense,
      income_count: incRow ? incRow.count : 0,
      expense_count: expRow ? expRow.count : 0,
    });
  }

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpense = months.reduce((s, m) => s + m.expense, 0);

  res.json({
    year: parseInt(year),
    months,
    total_income: totalIncome,
    total_expense: totalExpense,
    profit: totalIncome - totalExpense,
  });
});

// Ангилалаар нэгтгэл
router.get("/summary/category", (req, res) => {
  const { year, type } = req.query;
  let dateFilter = "";
  const params = [req.user.id];

  if (year) {
    dateFilter += " AND strftime('%Y', record_date) = ?";
    params.push(String(year));
  }
  if (type && (type === "income" || type === "expense")) {
    dateFilter += " AND type = ?";
    params.push(type);
  }

  const rows = db.prepare(`
    SELECT type, category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM finance_records
    WHERE user_id = ?${dateFilter}
    GROUP BY type, category
    ORDER BY total DESC
  `).all(...params);

  const income = rows.filter(r => r.type === "income");
  const expense = rows.filter(r => r.type === "expense");

  res.json({ income, expense });
});

// Ашиг шимийн тооцоо (нэг малд ноогдох)
router.get("/profitability", (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  // Малын тоог livestock хүснэгтээс авах
  const livestock = db.prepare(`
    SELECT COALESCE(SUM(total_count), 0) as total_head
    FROM livestock
    WHERE user_id = ?
  `).get(req.user.id);

  const totalHead = livestock.total_head || 0;

  const income = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM finance_records WHERE user_id = ? AND type = 'income' AND strftime('%Y', record_date) = ?`
  ).get(req.user.id, String(year));
  const expense = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM finance_records WHERE user_id = ? AND type = 'expense' AND strftime('%Y', record_date) = ?`
  ).get(req.user.id, String(year));

  const totalIncome = income.total;
  const totalExpense = expense.total;
  const profit = totalIncome - totalExpense;

  res.json({
    year: parseInt(year),
    total_head: totalHead,
    total_income: totalIncome,
    total_expense: totalExpense,
    profit,
    per_animal: totalHead > 0 ? {
      income: Math.round(totalIncome / totalHead),
      expense: Math.round(totalExpense / totalHead),
      profit: Math.round(profit / totalHead),
    } : null,
  });
});

// ==================== ТӨСӨВ ====================

// Төсөв авах
router.get("/budget", (req, res) => {
  const { year, month } = req.query;
  let sql = "SELECT * FROM finance_budgets WHERE user_id = ?";
  const params = [req.user.id];

  if (year) {
    sql += " AND year = ?";
    params.push(parseInt(year));
  }
  if (month) {
    sql += " AND month = ?";
    params.push(parseInt(month));
  }

  sql += " ORDER BY year DESC, month DESC";
  res.json(db.prepare(sql).all(...params));
});

// Төсөв тогтоох/шинэчлэх
router.post("/budget", (req, res) => {
  const { year, month, category, type, budget_amount, note } = req.body;
  if (!year || !month || !budget_amount) {
    return res.status(400).json({ error: "year, month, budget_amount заавал шаардлагатай" });
  }

  // Байгаа эсэхийг шалгах
  const existing = db.prepare(
    "SELECT id FROM finance_budgets WHERE user_id = ? AND year = ? AND month = ? AND category = ? AND type = ?"
  ).get(req.user.id, year, month, category || "", type || "expense");

  if (existing) {
    db.prepare(
      "UPDATE finance_budgets SET budget_amount = ?, note = ? WHERE id = ?"
    ).run(budget_amount, note || "", existing.id);
    const updated = db.prepare("SELECT * FROM finance_budgets WHERE id = ?").get(existing.id);
    return res.json(updated);
  }

  const result = db.prepare(
    "INSERT INTO finance_budgets (user_id, year, month, category, type, budget_amount, note) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(req.user.id, year, month, category || "", type || "expense", budget_amount, note || "");

  const item = db.prepare("SELECT * FROM finance_budgets WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Төсөв устгах
router.delete("/budget/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM finance_budgets WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Төсөв олдсонгүй" });

  db.prepare("DELETE FROM finance_budgets WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

// Төсөв vs бодит зардал харьцуулалт
router.get("/budget/compare", (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

  const budgets = db.prepare(
    "SELECT * FROM finance_budgets WHERE user_id = ? AND year = ? AND month = ?"
  ).all(req.user.id, year, month);

  const actuals = db.prepare(`
    SELECT category, type, COALESCE(SUM(amount), 0) as actual
    FROM finance_records
    WHERE user_id = ? AND strftime('%Y', record_date) = ? AND strftime('%m', record_date) = ?
    GROUP BY category, type
  `).all(req.user.id, String(year), String(month).padStart(2, "0"));

  const comparison = budgets.map(b => {
    const actual = actuals.find(a => a.category === b.category && a.type === b.type);
    const actualAmount = actual ? actual.actual : 0;
    return {
      ...b,
      actual: actualAmount,
      difference: b.budget_amount - actualAmount,
      percent_used: b.budget_amount > 0 ? Math.round((actualAmount / b.budget_amount) * 100) : 0,
    };
  });

  res.json({ year, month, comparison });
});

// ==================== СТАТИСТИК ====================

// Жилүүдийн жагсаалт (бүртгэлтэй)
router.get("/years", (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT CAST(strftime('%Y', record_date) AS INTEGER) as year
    FROM finance_records
    WHERE user_id = ?
    ORDER BY year DESC
  `).all(req.user.id);
  res.json(rows.map(r => r.year));
});

// Чиг хандлага (сүүлийн N сар)
router.get("/trend", (req, res) => {
  const months = parseInt(req.query.months) || 6;

  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', record_date) as ym,
      type,
      COALESCE(SUM(amount), 0) as total
    FROM finance_records
    WHERE user_id = ?
      AND date(record_date) >= date('now', '-${months} months')
    GROUP BY ym, type
    ORDER BY ym
  `).all(req.user.id);

  // Сүүлийн N сарыг generate хийх
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inc = rows.find(r => r.ym === ym && r.type === "income");
    const exp = rows.find(r => r.ym === ym && r.type === "expense");
    const income = inc ? inc.total : 0;
    const expense = exp ? exp.total : 0;
    result.push({
      year_month: ym,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      income,
      expense,
      profit: income - expense,
    });
  }

  res.json(result);
});

module.exports = router;
