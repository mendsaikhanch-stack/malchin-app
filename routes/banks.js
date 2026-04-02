const express = require("express");
const router = express.Router();
const db = require("../db");

// Бүх банкны ханш
router.get("/rates", (req, res) => {
  res.json(db.prepare("SELECT * FROM bank_rates ORDER BY bank_name").all());
});

// Тодорхой банкны ханш
router.get("/rates/:code", (req, res) => {
  const bank = db.prepare("SELECT * FROM bank_rates WHERE bank_code = ?").get(req.params.code);
  if (!bank) return res.status(404).json({ error: "Банк олдсонгүй" });
  res.json(bank);
});

// Хамгийн сайн ханш харьцуулалт
router.get("/best", (req, res) => {
  const bestUsdBuy = db.prepare("SELECT bank_name, usd_buy FROM bank_rates ORDER BY usd_buy DESC LIMIT 1").get();
  const bestUsdSell = db.prepare("SELECT bank_name, usd_sell FROM bank_rates ORDER BY usd_sell ASC LIMIT 1").get();
  const bestLoan = db.prepare("SELECT bank_name, herder_loan_rate FROM bank_rates ORDER BY herder_loan_rate ASC LIMIT 1").get();
  const bestDeposit = db.prepare("SELECT bank_name, deposit_rate FROM bank_rates ORDER BY deposit_rate DESC LIMIT 1").get();
  res.json({ bestUsdBuy, bestUsdSell, bestLoan, bestDeposit });
});

module.exports = router;
