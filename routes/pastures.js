const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// ============ СТАТИСТИК ============

router.get("/stats", verifyToken, (req, res) => {
  const userId = req.user.id;
  const currentYear = new Date().getFullYear().toString();

  // Бэлчээрийн тоо төрлөөр
  const pasturesByType = db.prepare("SELECT type, COUNT(*) as count FROM pastures WHERE user_id = ? GROUP BY type").all(userId);
  const totalPastures = db.prepare("SELECT COUNT(*) as count FROM pastures WHERE user_id = ?").get(userId).count;

  // Идэвхтэй бэлчээрлэлт
  const activeGrazings = db.prepare("SELECT COUNT(*) as count FROM grazing_records WHERE user_id = ? AND (end_date IS NULL OR end_date = '')").get(userId).count;

  // Энэ жилийн нүүдэл
  const migrationsThisYear = db.prepare("SELECT COUNT(*) as count FROM migrations WHERE user_id = ? AND strftime('%Y', migration_date) = ?").get(userId, currentYear).count;

  // Энэ жилийн нийт нүүдлийн зай
  const totalDistance = db.prepare("SELECT COALESCE(SUM(distance_km), 0) as total FROM migrations WHERE user_id = ? AND strftime('%Y', migration_date) = ?").get(userId, currentYear).total;

  // Бэлчээр тус бүрийн малын тоо (идэвхтэй бэлчээрлэлтээр)
  const animalDistribution = db.prepare(`
    SELECT p.id, p.name, p.type, COALESCE(gr.animal_count, 0) as animal_count
    FROM pastures p
    LEFT JOIN grazing_records gr ON p.id = gr.pasture_id AND (gr.end_date IS NULL OR gr.end_date = '')
    WHERE p.user_id = ?
    ORDER BY gr.animal_count DESC
  `).all(userId);

  res.json({
    totalPastures,
    pasturesByType,
    activeGrazings,
    migrationsThisYear,
    totalDistanceKm: totalDistance,
    animalDistribution
  });
});

// ============ БЭЛЧЭЭРЛЭЛТ ============

// Идэвхтэй бэлчээрлэлтүүд
router.get("/grazing/current", verifyToken, (req, res) => {
  const records = db.prepare(`
    SELECT gr.*, p.name as pasture_name FROM grazing_records gr
    LEFT JOIN pastures p ON gr.pasture_id = p.id
    WHERE gr.user_id = ? AND (gr.end_date IS NULL OR gr.end_date = '')
    ORDER BY gr.start_date DESC
  `).all(req.user.id);
  res.json(records);
});

// Бэлчээрлэлтийн бүртгэлүүд
router.get("/grazing", verifyToken, (req, res) => {
  const { pasture_id, active } = req.query;
  let sql = `SELECT gr.*, p.name as pasture_name FROM grazing_records gr
    LEFT JOIN pastures p ON gr.pasture_id = p.id
    WHERE gr.user_id = ?`;
  const params = [req.user.id];

  if (pasture_id) { sql += " AND gr.pasture_id = ?"; params.push(pasture_id); }
  if (active === "1") { sql += " AND (gr.end_date IS NULL OR gr.end_date = '')"; }

  sql += " ORDER BY gr.created_at DESC";
  res.json(db.prepare(sql).all(...params));
});

// Бэлчээрлэлт эхлүүлэх
router.post("/grazing", verifyToken, (req, res) => {
  const { pasture_id, start_date, animal_count, grass_condition_start, notes } = req.body;
  if (!pasture_id || !start_date) return res.status(400).json({ error: "pasture_id, start_date заавал шаардлагатай" });

  const pasture = db.prepare("SELECT * FROM pastures WHERE id = ? AND user_id = ?").get(pasture_id, req.user.id);
  if (!pasture) return res.status(404).json({ error: "Бэлчээр олдсонгүй" });

  const result = db.prepare(`
    INSERT INTO grazing_records (user_id, pasture_id, animal_count, start_date, grass_condition_start, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, pasture_id, animal_count || 0, start_date, grass_condition_start || "", notes || "");

  res.status(201).json(db.prepare("SELECT * FROM grazing_records WHERE id = ?").get(result.lastInsertRowid));
});

// Бэлчээрлэлт дуусгах
router.put("/grazing/:id/end", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM grazing_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бэлчээрлэлтийн бүртгэл олдсонгүй" });

  const { end_date, grass_condition_end } = req.body;
  if (!end_date) return res.status(400).json({ error: "end_date заавал шаардлагатай" });

  db.prepare("UPDATE grazing_records SET end_date = ?, grass_condition_end = ? WHERE id = ? AND user_id = ?")
    .run(end_date, grass_condition_end || "", req.params.id, req.user.id);

  res.json(db.prepare("SELECT * FROM grazing_records WHERE id = ?").get(req.params.id));
});

// Бэлчээрлэлт засах
router.put("/grazing/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM grazing_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бэлчээрлэлтийн бүртгэл олдсонгүй" });

  const { pasture_id, animal_count, start_date, end_date, grass_condition_start, grass_condition_end, notes } = req.body;

  db.prepare(`
    UPDATE grazing_records SET pasture_id=?, animal_count=?, start_date=?, end_date=?, grass_condition_start=?, grass_condition_end=?, notes=?
    WHERE id = ? AND user_id = ?
  `).run(
    pasture_id ?? existing.pasture_id, animal_count ?? existing.animal_count, start_date ?? existing.start_date,
    end_date ?? existing.end_date, grass_condition_start ?? existing.grass_condition_start,
    grass_condition_end ?? existing.grass_condition_end, notes ?? existing.notes, req.params.id, req.user.id
  );

  res.json(db.prepare("SELECT * FROM grazing_records WHERE id = ?").get(req.params.id));
});

// Бэлчээрлэлт устгах
router.delete("/grazing/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM grazing_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бэлчээрлэлтийн бүртгэл олдсонгүй" });

  db.prepare("DELETE FROM grazing_records WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ============ НҮҮДЭЛ ============

// Нүүдлийн бүртгэлүүд
router.get("/migrations", verifyToken, (req, res) => {
  const { year } = req.query;
  let sql = `SELECT m.*, fp.name as from_pasture_name, tp.name as to_pasture_name FROM migrations m
    LEFT JOIN pastures fp ON m.from_pasture_id = fp.id
    LEFT JOIN pastures tp ON m.to_pasture_id = tp.id
    WHERE m.user_id = ?`;
  const params = [req.user.id];

  if (year) { sql += " AND strftime('%Y', m.migration_date) = ?"; params.push(year); }

  sql += " ORDER BY m.migration_date DESC";
  res.json(db.prepare(sql).all(...params));
});

// Нүүдэл бүртгэх
router.post("/migrations", verifyToken, (req, res) => {
  const { from_pasture_id, to_pasture_id, from_location, to_location, migration_date, animal_count, distance_km, duration_hours, reason, transport_method, cost, notes } = req.body;
  if (!migration_date) return res.status(400).json({ error: "migration_date заавал шаардлагатай" });

  const result = db.prepare(`
    INSERT INTO migrations (user_id, from_pasture_id, to_pasture_id, from_location, to_location, migration_date, animal_count, distance_km, duration_hours, reason, transport_method, cost, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, from_pasture_id || null, to_pasture_id || null, from_location || "", to_location || "", migration_date, animal_count || 0, distance_km || 0, duration_hours || 0, reason || "", transport_method || "on_foot", cost || 0, notes || "");

  res.status(201).json(db.prepare("SELECT * FROM migrations WHERE id = ?").get(result.lastInsertRowid));
});

// Нүүдэл засах
router.put("/migrations/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM migrations WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Нүүдлийн бүртгэл олдсонгүй" });

  const { from_pasture_id, to_pasture_id, from_location, to_location, migration_date, animal_count, distance_km, duration_hours, reason, transport_method, cost, notes } = req.body;

  db.prepare(`
    UPDATE migrations SET from_pasture_id=?, to_pasture_id=?, from_location=?, to_location=?, migration_date=?, animal_count=?, distance_km=?, duration_hours=?, reason=?, transport_method=?, cost=?, notes=?
    WHERE id = ? AND user_id = ?
  `).run(
    from_pasture_id ?? existing.from_pasture_id, to_pasture_id ?? existing.to_pasture_id,
    from_location ?? existing.from_location, to_location ?? existing.to_location,
    migration_date ?? existing.migration_date, animal_count ?? existing.animal_count,
    distance_km ?? existing.distance_km, duration_hours ?? existing.duration_hours,
    reason ?? existing.reason, transport_method ?? existing.transport_method,
    cost ?? existing.cost, notes ?? existing.notes, req.params.id, req.user.id
  );

  res.json(db.prepare("SELECT * FROM migrations WHERE id = ?").get(req.params.id));
});

// Нүүдэл устгах
router.delete("/migrations/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM migrations WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Нүүдлийн бүртгэл олдсонгүй" });

  db.prepare("DELETE FROM migrations WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ============ БЭЛЧЭЭР ============

// Бэлчээрүүдийн жагсаалт
router.get("/", verifyToken, (req, res) => {
  const { type } = req.query;
  let sql = "SELECT * FROM pastures WHERE user_id = ?";
  const params = [req.user.id];

  if (type) { sql += " AND type = ?"; params.push(type); }

  sql += " ORDER BY created_at DESC";
  res.json(db.prepare(sql).all(...params));
});

// Нэг бэлчээр дэлгэрэнгүй (+ идэвхтэй бэлчээрлэлт)
router.get("/:id", verifyToken, (req, res) => {
  const pasture = db.prepare("SELECT * FROM pastures WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!pasture) return res.status(404).json({ error: "Бэлчээр олдсонгүй" });

  const activeGrazing = db.prepare("SELECT * FROM grazing_records WHERE pasture_id = ? AND user_id = ? AND (end_date IS NULL OR end_date = '')").get(req.params.id, req.user.id);

  res.json({ ...pasture, activeGrazing: activeGrazing || null });
});

// Бэлчээр нэмэх
router.post("/", verifyToken, (req, res) => {
  const { name, type, lat, lng, area, area_unit, grass_quality, water_source, capacity, aimag, sum, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Бэлчээрийн нэр заавал шаардлагатай" });

  const result = db.prepare(`
    INSERT INTO pastures (user_id, name, type, lat, lng, area, area_unit, grass_quality, water_source, capacity, aimag, sum, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, type || "summer", lat || 0, lng || 0, area || 0, area_unit || "га", grass_quality || "good", water_source || "", capacity || 0, aimag || "", sum || "", notes || "");

  res.status(201).json(db.prepare("SELECT * FROM pastures WHERE id = ?").get(result.lastInsertRowid));
});

// Бэлчээр засах
router.put("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM pastures WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бэлчээр олдсонгүй" });

  const { name, type, lat, lng, area, area_unit, grass_quality, water_source, capacity, aimag, sum, notes } = req.body;

  db.prepare(`
    UPDATE pastures SET name=?, type=?, lat=?, lng=?, area=?, area_unit=?, grass_quality=?, water_source=?, capacity=?, aimag=?, sum=?, notes=?
    WHERE id = ? AND user_id = ?
  `).run(
    name ?? existing.name, type ?? existing.type, lat ?? existing.lat, lng ?? existing.lng,
    area ?? existing.area, area_unit ?? existing.area_unit, grass_quality ?? existing.grass_quality,
    water_source ?? existing.water_source, capacity ?? existing.capacity, aimag ?? existing.aimag,
    sum ?? existing.sum, notes ?? existing.notes, req.params.id, req.user.id
  );

  res.json(db.prepare("SELECT * FROM pastures WHERE id = ?").get(req.params.id));
});

// Бэлчээр устгах
router.delete("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM pastures WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Бэлчээр олдсонгүй" });

  db.prepare("DELETE FROM pastures WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
