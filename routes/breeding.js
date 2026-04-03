const express = require("express")
const router = express.Router()
const db = require("../db")
const { verifyToken } = require("../middleware/auth")

// Малын төрлөөр жирэмслэлтийн хугацаа (хоногоор)
const GESTATION_DAYS = {
  sheep: 150,
  goat: 150,
  cattle: 280,
  horse: 340,
  camel: 390
}

// ==================== BREEDING RECORDS ====================

// Хээлтүүлгийн бүртгэлүүд
router.get("/", verifyToken, (req, res) => {
  const { status, animal_type } = req.query
  let sql = `
    SELECT br.*,
      f.name as female_name, f.animal_type, f.ear_tag as female_ear_tag,
      m.name as male_name, m.ear_tag as male_ear_tag
    FROM breeding_records br
    LEFT JOIN animals f ON br.female_id = f.id
    LEFT JOIN animals m ON br.male_id = m.id
    WHERE br.user_id = ?
  `
  const params = [req.user.id]

  if (status) { sql += " AND br.status = ?"; params.push(status) }
  if (animal_type) { sql += " AND f.animal_type = ?"; params.push(animal_type) }

  sql += " ORDER BY br.created_at DESC"
  res.json(db.prepare(sql).all(...params))
})

// Хээлтүүлгийн календарь - ойрын 60 хоногийн төллөх хугацаа
router.get("/calendar", verifyToken, (req, res) => {
  const records = db.prepare(`
    SELECT br.*,
      f.name as female_name, f.animal_type, f.ear_tag as female_ear_tag,
      m.name as male_name
    FROM breeding_records br
    LEFT JOIN animals f ON br.female_id = f.id
    LEFT JOIN animals m ON br.male_id = m.id
    WHERE br.user_id = ?
      AND br.expected_due_date != ''
      AND br.expected_due_date >= date('now')
      AND br.expected_due_date <= date('now', '+60 days')
      AND br.status IN ('bred', 'confirmed', 'due')
    ORDER BY br.expected_due_date ASC
  `).all(req.user.id)
  res.json(records)
})

// ==================== STATS ====================

// Хээлтүүлгийн статистик
router.get("/stats", verifyToken, (req, res) => {
  const userId = req.user.id
  const year = new Date().getFullYear()

  const totalBreedings = db.prepare("SELECT COUNT(*) as count FROM breeding_records WHERE user_id = ? AND breeding_date >= ?").get(userId, `${year}-01-01`).count

  const deliveredCount = db.prepare("SELECT COUNT(*) as count FROM breeding_records WHERE user_id = ? AND breeding_date >= ? AND status = 'delivered'").get(userId, `${year}-01-01`).count
  const failedCount = db.prepare("SELECT COUNT(*) as count FROM breeding_records WHERE user_id = ? AND breeding_date >= ? AND status = 'failed'").get(userId, `${year}-01-01`).count
  const completedCount = deliveredCount + failedCount
  const successRate = completedCount > 0 ? Math.round((deliveredCount / completedCount) * 100) : 0

  const birthsThisYear = db.prepare("SELECT COUNT(*) as count FROM birth_records WHERE user_id = ? AND birth_date >= ?").get(userId, `${year}-01-01`).count

  const avgOffspring = db.prepare("SELECT AVG(offspring_count) as avg FROM birth_records WHERE user_id = ? AND birth_date >= ?").get(userId, `${year}-01-01`).avg || 0

  const upcomingDue = db.prepare("SELECT COUNT(*) as count FROM breeding_records WHERE user_id = ? AND expected_due_date >= date('now') AND status IN ('bred', 'confirmed', 'due')").get(userId).count

  res.json({
    totalBreedings,
    successRate,
    birthsThisYear,
    avgOffspringPerBirth: Math.round(avgOffspring * 10) / 10,
    upcomingDueCount: upcomingDue
  })
})

// ==================== BIRTH RECORDS ====================

// Төллөлтийн бүртгэлүүд
router.get("/births", verifyToken, (req, res) => {
  const records = db.prepare(`
    SELECT br.*,
      mo.name as mother_name, mo.animal_type, mo.ear_tag as mother_ear_tag,
      fa.name as father_name, fa.ear_tag as father_ear_tag
    FROM birth_records br
    LEFT JOIN animals mo ON br.mother_id = mo.id
    LEFT JOIN animals fa ON br.father_id = fa.id
    WHERE br.user_id = ?
    ORDER BY br.birth_date DESC
  `).all(req.user.id)
  res.json(records)
})

// Нэг төллөлтийн бүртгэл
router.get("/births/:id", verifyToken, (req, res) => {
  const record = db.prepare(`
    SELECT br.*,
      mo.name as mother_name, mo.animal_type, mo.ear_tag as mother_ear_tag, mo.breed as mother_breed,
      fa.name as father_name, fa.ear_tag as father_ear_tag, fa.breed as father_breed
    FROM birth_records br
    LEFT JOIN animals mo ON br.mother_id = mo.id
    LEFT JOIN animals fa ON br.father_id = fa.id
    WHERE br.id = ? AND br.user_id = ?
  `).get(req.params.id, req.user.id)
  if (!record) return res.status(404).json({ error: "Төллөлтийн бүртгэл олдсонгүй" })
  res.json(record)
})

// Төллөлт бүртгэх
router.post("/births", verifyToken, (req, res) => {
  const { mother_id, father_id, breeding_id, birth_date, offspring_count, alive_count, difficulty, notes } = req.body
  if (!mother_id || !birth_date) return res.status(400).json({ error: "Эх мал болон төрсөн огноо заавал шаардлагатай" })

  const validDifficulty = ["easy", "normal", "difficult", "emergency"]
  const diff = difficulty && validDifficulty.includes(difficulty) ? difficulty : "normal"

  const result = db.prepare(`
    INSERT INTO birth_records (user_id, breeding_id, mother_id, father_id, birth_date, offspring_count, alive_count, difficulty, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, breeding_id || null, mother_id, father_id || null, birth_date, offspring_count || 1, alive_count !== undefined ? alive_count : (offspring_count || 1), diff, notes || "")

  // Хээлтүүлгийн бүртгэлийн статусыг шинэчлэх
  if (breeding_id) {
    db.prepare("UPDATE breeding_records SET status = 'delivered' WHERE id = ? AND user_id = ?").run(breeding_id, req.user.id)
  }

  res.status(201).json(db.prepare("SELECT * FROM birth_records WHERE id = ?").get(result.lastInsertRowid))
})

// Төллөлтийн бүртгэл засах
router.put("/births/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM birth_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!existing) return res.status(404).json({ error: "Төллөлтийн бүртгэл олдсонгүй" })

  const { mother_id, father_id, breeding_id, birth_date, offspring_count, alive_count, difficulty, notes } = req.body

  db.prepare(`
    UPDATE birth_records SET mother_id = ?, father_id = ?, breeding_id = ?, birth_date = ?, offspring_count = ?, alive_count = ?, difficulty = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    mother_id || existing.mother_id,
    father_id !== undefined ? father_id : existing.father_id,
    breeding_id !== undefined ? breeding_id : existing.breeding_id,
    birth_date || existing.birth_date,
    offspring_count || existing.offspring_count,
    alive_count !== undefined ? alive_count : existing.alive_count,
    difficulty || existing.difficulty,
    notes !== undefined ? notes : existing.notes,
    req.params.id, req.user.id
  )

  res.json(db.prepare("SELECT * FROM birth_records WHERE id = ?").get(req.params.id))
})

// Төллөлтийн бүртгэл устгах
router.delete("/births/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM birth_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!existing) return res.status(404).json({ error: "Төллөлтийн бүртгэл олдсонгүй" })

  db.prepare("DELETE FROM birth_records WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// ==================== BREEDING :id ROUTES ====================

// Нэг хээлтүүлгийн бүртгэл
router.get("/:id", verifyToken, (req, res) => {
  const record = db.prepare(`
    SELECT br.*,
      f.name as female_name, f.animal_type, f.ear_tag as female_ear_tag, f.breed as female_breed,
      m.name as male_name, m.ear_tag as male_ear_tag, m.breed as male_breed
    FROM breeding_records br
    LEFT JOIN animals f ON br.female_id = f.id
    LEFT JOIN animals m ON br.male_id = m.id
    WHERE br.id = ? AND br.user_id = ?
  `).get(req.params.id, req.user.id)
  if (!record) return res.status(404).json({ error: "Хээлтүүлгийн бүртгэл олдсонгүй" })
  res.json(record)
})

// Хээлтүүлэг бүртгэх
router.post("/", verifyToken, (req, res) => {
  const { female_id, male_id, breeding_date, breeding_method, expected_due_date, notes } = req.body
  if (!female_id || !breeding_date) return res.status(400).json({ error: "Эм мал болон хээлтүүлсэн огноо заавал шаардлагатай" })

  // expected_due_date автоматаар тооцоолох
  let dueDate = expected_due_date || ""
  if (!dueDate) {
    const female = db.prepare("SELECT animal_type FROM animals WHERE id = ? AND user_id = ?").get(female_id, req.user.id)
    if (female && GESTATION_DAYS[female.animal_type]) {
      const days = GESTATION_DAYS[female.animal_type]
      dueDate = db.prepare("SELECT date(?, '+' || ? || ' days') as due").get(breeding_date, days).due
    }
  }

  const result = db.prepare(`
    INSERT INTO breeding_records (user_id, female_id, male_id, breeding_date, breeding_method, expected_due_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, female_id, male_id || null, breeding_date, breeding_method || "natural", dueDate, notes || "")

  res.status(201).json(db.prepare("SELECT * FROM breeding_records WHERE id = ?").get(result.lastInsertRowid))
})

// Хээлтүүлгийн бүртгэл засах
router.put("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM breeding_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!existing) return res.status(404).json({ error: "Хээлтүүлгийн бүртгэл олдсонгүй" })

  const { female_id, male_id, breeding_date, breeding_method, expected_due_date, status, result: resultText, notes } = req.body

  db.prepare(`
    UPDATE breeding_records SET female_id = ?, male_id = ?, breeding_date = ?, breeding_method = ?, expected_due_date = ?, status = ?, result = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    female_id || existing.female_id,
    male_id !== undefined ? male_id : existing.male_id,
    breeding_date || existing.breeding_date,
    breeding_method || existing.breeding_method,
    expected_due_date !== undefined ? expected_due_date : existing.expected_due_date,
    status || existing.status,
    resultText !== undefined ? resultText : existing.result,
    notes !== undefined ? notes : existing.notes,
    req.params.id, req.user.id
  )

  res.json(db.prepare("SELECT * FROM breeding_records WHERE id = ?").get(req.params.id))
})

// Хээлтүүлгийн бүртгэл устгах
router.delete("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM breeding_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!existing) return res.status(404).json({ error: "Хээлтүүлгийн бүртгэл олдсонгүй" })

  db.prepare("DELETE FROM breeding_records WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// Статус шинэчлэх (bred → confirmed → due → delivered → failed)
router.put("/:id/status", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM breeding_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!existing) return res.status(404).json({ error: "Хээлтүүлгийн бүртгэл олдсонгүй" })

  const { status } = req.body
  const validStatuses = ["bred", "confirmed", "due", "delivered", "failed"]
  if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: "Буруу статус. Зөвшөөрөгдөх: bred, confirmed, due, delivered, failed" })

  db.prepare("UPDATE breeding_records SET status = ? WHERE id = ? AND user_id = ?").run(status, req.params.id, req.user.id)
  res.json(db.prepare("SELECT * FROM breeding_records WHERE id = ?").get(req.params.id))
})

module.exports = router
