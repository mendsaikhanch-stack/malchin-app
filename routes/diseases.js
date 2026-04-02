const express = require("express");
const router = express.Router();
const db = require("../db");

// Малын төрлөөр өвчний жагсаалт
router.get("/:animal_type", (req, res) => {
  const diseases = db.prepare("SELECT * FROM animal_diseases WHERE animal_type = ? ORDER BY severity DESC, disease_name").all(req.params.animal_type);
  res.json(diseases);
});

// Бүх өвчин
router.get("/", (req, res) => {
  const { animal_type, severity } = req.query;
  let sql = "SELECT * FROM animal_diseases WHERE 1=1";
  const params = [];
  if (animal_type) { sql += " AND animal_type = ?"; params.push(animal_type); }
  if (severity) { sql += " AND severity = ?"; params.push(severity); }
  sql += " ORDER BY animal_type, severity DESC";
  res.json(db.prepare(sql).all(...params));
});

// Шинж тэмдэгээр хайх (keyword matching)
router.post("/match", (req, res) => {
  const { animal_type, symptoms } = req.body;
  if (!symptoms) return res.json([]);

  const keywords = symptoms.toLowerCase().split(/[,\s]+/).filter(Boolean);
  let diseases;
  if (animal_type) {
    diseases = db.prepare("SELECT * FROM animal_diseases WHERE animal_type = ?").all(animal_type);
  } else {
    diseases = db.prepare("SELECT * FROM animal_diseases").all();
  }

  // Score each disease by keyword matches
  const scored = diseases.map(d => {
    const searchText = (d.symptoms + " " + d.tags + " " + d.disease_name).toLowerCase();
    let score = 0;
    keywords.forEach(kw => {
      if (kw.length < 2) return;
      if (searchText.includes(kw)) score += 2;
      // Partial match
      else if (kw.length >= 3) {
        const chars = kw.split('');
        const partialMatch = chars.filter(c => searchText.includes(c)).length / chars.length;
        if (partialMatch > 0.6) score += 1;
      }
    });
    return { ...d, match_score: score };
  }).filter(d => d.match_score > 0).sort((a, b) => b.match_score - a.match_score);

  res.json(scored.slice(0, 5));
});

module.exports = router;
