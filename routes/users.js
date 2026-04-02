const express = require("express");
const router = express.Router();
const db = require("../db");

const getAll = db.prepare("SELECT * FROM users");
const getByPhone = db.prepare("SELECT * FROM users WHERE phone = ?");
const insert = db.prepare("INSERT INTO users (phone, name, aimag, sum, bag) VALUES (?, ?, ?, ?, ?)");

router.get("/", (req, res) => {
  res.json(getAll.all());
});

router.post("/create", (req, res) => {
  const { phone, name, aimag, sum, bag } = req.body;
  try {
    const result = insert.run(phone, name, aimag || "", sum || "", bag || "");
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const user = getByPhone.get(phone);
      return res.json(user);
    }
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", (req, res) => {
  const user = getByPhone.get(req.body.phone);
  if (!user) return res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
  res.json(user);
});

module.exports = router;
