const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// ===================== ЭРҮҮЛ МЭНДИЙН БҮРТГЭЛ =====================

// Эрүүл мэндийн бүртгэлийн жагсаалт (шүүлтүүртэй)
router.get("/", verifyToken, (req, res) => {
  const { animal_id, record_type, severity, status } = req.query;
  let sql = `
    SELECT h.*, a.name as animal_name, a.animal_type
    FROM health_records h
    LEFT JOIN animals a ON h.animal_id = a.id
    WHERE h.user_id = ?
  `;
  const params = [req.user.id];

  if (animal_id) { sql += " AND h.animal_id = ?"; params.push(animal_id); }
  if (record_type) { sql += " AND h.record_type = ?"; params.push(record_type); }
  if (severity) { sql += " AND h.severity = ?"; params.push(severity); }
  if (status) { sql += " AND h.status = ?"; params.push(status); }

  sql += " ORDER BY h.record_date DESC";
  res.json(db.prepare(sql).all(...params));
});

// Тодорхой малын эрүүл мэндийн бүртгэл
router.get("/animal/:animal_id", verifyToken, (req, res) => {
  const records = db.prepare(`
    SELECT h.*, a.name as animal_name, a.animal_type
    FROM health_records h
    LEFT JOIN animals a ON h.animal_id = a.id
    WHERE h.animal_id = ? AND h.user_id = ?
    ORDER BY h.record_date ASC
  `).all(req.params.animal_id, req.user.id);
  res.json(records);
});

// Эрүүл мэндийн тойм статистик
router.get("/stats", verifyToken, (req, res) => {
  const userId = req.user.id;
  const yearStart = new Date().getFullYear() + "-01-01";

  const totalTreatments = db.prepare(
    "SELECT COUNT(*) as count FROM health_records WHERE user_id = ? AND record_date >= ?"
  ).get(userId, yearStart).count;

  const vaccinationCount = db.prepare(
    "SELECT COUNT(*) as count FROM vaccination_records WHERE user_id = ? AND vaccination_date >= ?"
  ).get(userId, yearStart).count;

  const commonDiseases = db.prepare(
    "SELECT diagnosis, COUNT(*) as count FROM health_records WHERE user_id = ? AND diagnosis != '' GROUP BY diagnosis ORDER BY count DESC LIMIT 5"
  ).all(userId);

  const needCheckup = db.prepare(
    "SELECT h.*, a.name as animal_name, a.animal_type FROM health_records h LEFT JOIN animals a ON h.animal_id = a.id WHERE h.user_id = ? AND h.next_checkup != '' AND h.next_checkup <= date('now', '+7 days') AND h.next_checkup >= date('now') ORDER BY h.next_checkup ASC"
  ).all(userId);

  const totalVetCosts = db.prepare(
    "SELECT COALESCE(SUM(cost), 0) as total FROM health_records WHERE user_id = ? AND record_date >= ?"
  ).get(userId, yearStart).total;

  res.json({ totalTreatments, vaccinationCount, commonDiseases, needCheckup, totalVetCosts });
});

// Эрүүл мэндийн бүртгэл нэмэх
router.post("/", verifyToken, (req, res) => {
  const { animal_id, record_type, title, description, diagnosis, treatment, medication, dosage, vet_name, cost, record_date, next_checkup, severity, status } = req.body;
  if (!animal_id || !record_type || !title || !record_date) {
    return res.status(400).json({ error: "animal_id, record_type, title, record_date заавал шаардлагатай" });
  }

  const result = db.prepare(`
    INSERT INTO health_records (user_id, animal_id, record_type, title, description, diagnosis, treatment, medication, dosage, vet_name, cost, record_date, next_checkup, severity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, animal_id, record_type, title,
    description || "", diagnosis || "", treatment || "", medication || "", dosage || "",
    vet_name || "", cost || 0, record_date, next_checkup || "", severity || "low", status || "treated"
  );

  res.status(201).json(db.prepare("SELECT * FROM health_records WHERE id = ?").get(result.lastInsertRowid));
});

// Эрүүл мэндийн бүртгэл засах
router.put("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM health_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });

  const { animal_id, record_type, title, description, diagnosis, treatment, medication, dosage, vet_name, cost, record_date, next_checkup, severity, status } = req.body;

  db.prepare(`
    UPDATE health_records SET animal_id=?, record_type=?, title=?, description=?, diagnosis=?, treatment=?, medication=?, dosage=?, vet_name=?, cost=?, record_date=?, next_checkup=?, severity=?, status=?
    WHERE id = ? AND user_id = ?
  `).run(
    animal_id ?? existing.animal_id, record_type ?? existing.record_type, title ?? existing.title,
    description ?? existing.description, diagnosis ?? existing.diagnosis, treatment ?? existing.treatment,
    medication ?? existing.medication, dosage ?? existing.dosage, vet_name ?? existing.vet_name,
    cost ?? existing.cost, record_date ?? existing.record_date, next_checkup ?? existing.next_checkup,
    severity ?? existing.severity, status ?? existing.status,
    req.params.id, req.user.id
  );

  res.json(db.prepare("SELECT * FROM health_records WHERE id = ?").get(req.params.id));
});

// Эрүүл мэндийн бүртгэл устгах
router.delete("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM health_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });

  db.prepare("DELETE FROM health_records WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ===================== ВАКЦИНЫ БҮРТГЭЛ =====================

// Вакцины бүртгэлийн жагсаалт
router.get("/vaccinations", verifyToken, (req, res) => {
  const { animal_type, vaccine_name } = req.query;
  let sql = `
    SELECT v.*, a.name as animal_name
    FROM vaccination_records v
    LEFT JOIN animals a ON v.animal_id = a.id
    WHERE v.user_id = ?
  `;
  const params = [req.user.id];

  if (animal_type) { sql += " AND v.animal_type = ?"; params.push(animal_type); }
  if (vaccine_name) { sql += " AND v.vaccine_name LIKE ?"; params.push(`%${vaccine_name}%`); }

  sql += " ORDER BY v.vaccination_date DESC";
  res.json(db.prepare(sql).all(...params));
});

// Тодорхой малын вакцины түүх
router.get("/vaccinations/animal/:animal_id", verifyToken, (req, res) => {
  const records = db.prepare(`
    SELECT v.*, a.name as animal_name, a.animal_type as a_type
    FROM vaccination_records v
    LEFT JOIN animals a ON v.animal_id = a.id
    WHERE v.animal_id = ? AND v.user_id = ?
    ORDER BY v.vaccination_date DESC
  `).all(req.params.animal_id, req.user.id);
  res.json(records);
});

// Удахгүй хийх вакцинууд (30 хоногийн дотор)
router.get("/vaccinations/due", verifyToken, (req, res) => {
  const records = db.prepare(`
    SELECT v.*, a.name as animal_name, a.animal_type as a_type
    FROM vaccination_records v
    LEFT JOIN animals a ON v.animal_id = a.id
    WHERE v.user_id = ? AND v.next_due_date != '' AND v.next_due_date <= date('now', '+30 days') AND v.next_due_date >= date('now')
    ORDER BY v.next_due_date ASC
  `).all(req.user.id);
  res.json(records);
});

// Вакцины бүртгэл нэмэх
router.post("/vaccinations", verifyToken, (req, res) => {
  const { animal_id, animal_type, animal_count, vaccine_name, disease, batch_number, administered_by, vaccination_date, next_due_date, cost, notes } = req.body;
  if (!vaccine_name || !vaccination_date) {
    return res.status(400).json({ error: "vaccine_name, vaccination_date заавал шаардлагатай" });
  }
  if (!animal_id && !animal_type) {
    return res.status(400).json({ error: "animal_id эсвэл animal_type аль нэг нь заавал шаардлагатай" });
  }

  const result = db.prepare(`
    INSERT INTO vaccination_records (user_id, animal_id, animal_type, animal_count, vaccine_name, disease, batch_number, administered_by, vaccination_date, next_due_date, cost, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, animal_id || null, animal_type || "", animal_count || 1,
    vaccine_name, disease || "", batch_number || "", administered_by || "",
    vaccination_date, next_due_date || "", cost || 0, notes || ""
  );

  res.status(201).json(db.prepare("SELECT * FROM vaccination_records WHERE id = ?").get(result.lastInsertRowid));
});

// Вакцины бүртгэл засах
router.put("/vaccinations/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM vaccination_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });

  const { animal_id, animal_type, animal_count, vaccine_name, disease, batch_number, administered_by, vaccination_date, next_due_date, cost, notes } = req.body;

  db.prepare(`
    UPDATE vaccination_records SET animal_id=?, animal_type=?, animal_count=?, vaccine_name=?, disease=?, batch_number=?, administered_by=?, vaccination_date=?, next_due_date=?, cost=?, notes=?
    WHERE id = ? AND user_id = ?
  `).run(
    animal_id ?? existing.animal_id, animal_type ?? existing.animal_type, animal_count ?? existing.animal_count,
    vaccine_name ?? existing.vaccine_name, disease ?? existing.disease, batch_number ?? existing.batch_number,
    administered_by ?? existing.administered_by, vaccination_date ?? existing.vaccination_date,
    next_due_date ?? existing.next_due_date, cost ?? existing.cost, notes ?? existing.notes,
    req.params.id, req.user.id
  );

  res.json(db.prepare("SELECT * FROM vaccination_records WHERE id = ?").get(req.params.id));
});

// Вакцины бүртгэл устгах
router.delete("/vaccinations/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM vaccination_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });

  db.prepare("DELETE FROM vaccination_records WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Нэг эрүүл мэндийн бүртгэл дэлгэрэнгүй (/:id must be AFTER /vaccinations routes)
router.get("/:id", verifyToken, (req, res) => {
  const record = db.prepare(`
    SELECT h.*, a.name as animal_name, a.animal_type
    FROM health_records h
    LEFT JOIN animals a ON h.animal_id = a.id
    WHERE h.id = ? AND h.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!record) return res.status(404).json({ error: "Бүртгэл олдсонгүй" });
  res.json(record);
});

module.exports = router;
