const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Бүх малын жагсаалт (хэрэглэгчийн)
router.get("/", verifyToken, (req, res) => {
  const { type, status, gender, search } = req.query;
  let sql = "SELECT * FROM animals WHERE user_id = ?";
  const params = [req.user.id];

  if (type) { sql += " AND animal_type = ?"; params.push(type); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  if (gender) { sql += " AND gender = ?"; params.push(gender); }
  if (search) { sql += " AND (name LIKE ? OR ear_tag LIKE ? OR chip_id LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  sql += " ORDER BY created_at DESC";
  res.json(db.prepare(sql).all(...params));
});

// Малын тоо статистик
router.get("/stats", verifyToken, (req, res) => {
  const userId = req.user.id;
  const total = db.prepare("SELECT COUNT(*) as count FROM animals WHERE user_id = ? AND status = 'active'").get(userId).count;
  const byType = db.prepare("SELECT animal_type, COUNT(*) as count FROM animals WHERE user_id = ? AND status = 'active' GROUP BY animal_type").all(userId);
  const byGender = db.prepare("SELECT gender, COUNT(*) as count FROM animals WHERE user_id = ? AND status = 'active' GROUP BY gender").all(userId);
  const recent = db.prepare("SELECT COUNT(*) as count FROM animals WHERE user_id = ? AND created_at >= datetime('now', '-30 days')").get(userId).count;
  res.json({ total, byType, byGender, recentAdded: recent });
});

// Нэг мал дэлгэрэнгүй (+ эх, эцэг, төлүүд, эрүүл мэнд)
router.get("/:id", verifyToken, (req, res) => {
  const animal = db.prepare("SELECT * FROM animals WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!animal) return res.status(404).json({ error: "Мал олдсонгүй" });

  // Эх эцгийн мэдээлэл
  const mother = animal.mother_id ? db.prepare("SELECT id, name, animal_type, ear_tag, breed FROM animals WHERE id = ?").get(animal.mother_id) : null;
  const father = animal.father_id ? db.prepare("SELECT id, name, animal_type, ear_tag, breed FROM animals WHERE id = ?").get(animal.father_id) : null;

  // Төлүүд
  const offspring = db.prepare("SELECT id, name, animal_type, gender, birth_date, ear_tag, status FROM animals WHERE (mother_id = ? OR father_id = ?) AND user_id = ?").all(animal.id, animal.id, req.user.id);

  // Сүүлийн эрүүл мэндийн бүртгэл
  const healthRecords = db.prepare("SELECT * FROM health_records WHERE animal_id = ? ORDER BY record_date DESC LIMIT 5").all(animal.id);

  // Вакцинууд
  const vaccinations = db.prepare("SELECT * FROM vaccination_records WHERE animal_id = ? ORDER BY vaccination_date DESC LIMIT 5").all(animal.id);

  res.json({ ...animal, mother, father, offspring, healthRecords, vaccinations });
});

// Мал бүртгэх
router.post("/", verifyToken, (req, res) => {
  const { animal_type, name, breed, gender, birth_date, color, weight, ear_tag, chip_id, brand_mark, photo_url, origin, origin_detail, mother_id, father_id, notes } = req.body;
  if (!animal_type) return res.status(400).json({ error: "Малын төрөл заавал шаардлагатай" });

  const result = db.prepare(`
    INSERT INTO animals (user_id, animal_type, name, breed, gender, birth_date, color, weight, ear_tag, chip_id, brand_mark, photo_url, origin, origin_detail, mother_id, father_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, animal_type, name || "", breed || "", gender || "", birth_date || "", color || "", weight || 0, ear_tag || "", chip_id || "", brand_mark || "", photo_url || "", origin || "own_birth", origin_detail || "", mother_id || null, father_id || null, notes || "");

  res.status(201).json(db.prepare("SELECT * FROM animals WHERE id = ?").get(result.lastInsertRowid));
});

// Олон мал нэг дор бүртгэх (batch)
router.post("/batch", verifyToken, (req, res) => {
  const { animals } = req.body;
  if (!animals || !Array.isArray(animals)) return res.status(400).json({ error: "animals массив шаардлагатай" });

  const stmt = db.prepare(`
    INSERT INTO animals (user_id, animal_type, name, breed, gender, birth_date, color, weight, ear_tag, chip_id, brand_mark, photo_url, origin, origin_detail, mother_id, father_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((list) => {
    const ids = [];
    for (const a of list) {
      const r = stmt.run(req.user.id, a.animal_type, a.name || "", a.breed || "", a.gender || "", a.birth_date || "", a.color || "", a.weight || 0, a.ear_tag || "", a.chip_id || "", a.brand_mark || "", a.photo_url || "", a.origin || "own_birth", a.origin_detail || "", a.mother_id || null, a.father_id || null, a.notes || "");
      ids.push(r.lastInsertRowid);
    }
    return ids;
  });

  const ids = insertMany(animals);
  res.status(201).json({ ok: true, count: ids.length, ids });
});

// Мал засах
router.put("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM animals WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Мал олдсонгүй" });

  const { name, breed, gender, birth_date, color, weight, ear_tag, chip_id, brand_mark, photo_url, origin, origin_detail, mother_id, father_id, status, notes } = req.body;

  db.prepare(`
    UPDATE animals SET name=?, breed=?, gender=?, birth_date=?, color=?, weight=?, ear_tag=?, chip_id=?, brand_mark=?, photo_url=?, origin=?, origin_detail=?, mother_id=?, father_id=?, status=?, notes=?, updated_at=datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    name ?? existing.name, breed ?? existing.breed, gender ?? existing.gender, birth_date ?? existing.birth_date,
    color ?? existing.color, weight ?? existing.weight, ear_tag ?? existing.ear_tag, chip_id ?? existing.chip_id,
    brand_mark ?? existing.brand_mark, photo_url ?? existing.photo_url, origin ?? existing.origin,
    origin_detail ?? existing.origin_detail, mother_id ?? existing.mother_id, father_id ?? existing.father_id,
    status ?? existing.status, notes ?? existing.notes, req.params.id, req.user.id
  );

  res.json(db.prepare("SELECT * FROM animals WHERE id = ?").get(req.params.id));
});

// Мал устгах (soft delete -> status = 'removed')
router.delete("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM animals WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Мал олдсонгүй" });

  db.prepare("UPDATE animals SET status = 'removed', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Ээмэг/чип хайх
router.get("/lookup/:tag", verifyToken, (req, res) => {
  const animal = db.prepare("SELECT * FROM animals WHERE (ear_tag = ? OR chip_id = ?) AND user_id = ?").get(req.params.tag, req.params.tag, req.user.id);
  if (!animal) return res.status(404).json({ error: "Олдсонгүй" });
  res.json(animal);
});

module.exports = router;
