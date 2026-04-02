const express = require("express");
const router = express.Router();
const db = require("../db");
let client = null;
try { const Anthropic = require("@anthropic-ai/sdk"); client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" }); } catch(e) {}
const SYSTEM = "Чи бол Монголын малчдад зориулсан AI зөвлөх. Нэр: Малчин AI. Монгол хэлээр, энгийн, алхамчилсан, товч хариулна.";
const KB = {
  "tura": "Мал тураах шалтгаанууд:\n1) Тэжээл хангалтгүй - өвс, тэжээлийн чанар муу\n2) Дотрын хорхой - улирал бүр хорхойн эм өгөх\n3) Шимэгч өвчин - зөгийн бал, давс өгөх\n4) Шүдний асуудал - хөгшин мал\n5) Стресс - нүүдэл, хүйтэн\n\nЗөвлөмж:\n- Малын эмчээр шалгуулах\n- Тэжээлийн нэмэлт: давсалсан өвс, витамин\n- Дулаан хашаанд байлгах\n- Ус хангалттай өгөх",
  "tol": "Төллөлтийн бэлтгэл:\n1) Хээлтэгч малд сүүлийн 2 сард тэжээл нэмэх\n2) Дулаан хашаа бэлдэх\n3) Цэвэр дэвсгэр, хуурай орчин\n4) Малын эмчтэй холбоо барих\n5) Төллөлтийн хэрэгсэл бэлдэх\n\nТөллөсний дараа:\n- Эх малд илүү тэжээл\n- Төлийг 30 минутад хөхүүлэх\n- Дулаан байлгах\n- 3 хоногт хүйн ул унах ёстой",
  "nooluur": "Ноолуурын бэлтгэл:\n1) 4-р сарын эхээр самнаж эхлэх\n2) Ямааг угааж цэвэрлэх\n3) Сайн самаар зөөлөн самнах\n4) Хуурай газар хадгалах\n5) Өнгөөр нь ялгах\n\nҮнийн мэдээ (2026):\n- Анхны ноолуур: 85,000-95,000₮/кг\n- Хяналтын ноолуур: 70,000-80,000₮/кг\n- Цагаан ноолуур илүү үнэтэй\n\nОрлого нэмэх:\n- Ангилж зарах\n- Хоршоогоор дамжуулах\n- Шууд үйлдвэрт зарах",
  "uvul": "Өвөлжилтийн бэлтгэл:\n1) 8-9 сараас өвс хадах\n2) Хашаа засах, дулаалах\n3) Тэжээлийн нөөц бүрдүүлэх\n4) Малыг тарчилгаанд оруулах\n5) Уст цэг шалгах\n6) Отрын бэлчээр тодорхойлох\n\nТэжээлийн хэрэгцээ (өдөрт):\n- 1 хонь: 2кг өвс\n- 1 ямаа: 1.5кг өвс\n- 1 үхэр: 8кг өвс\n- 1 морь: 10кг өвс\n- 1 тэмээ: 12кг өвс",
  "uvchun": "Түгээмэл малын өвчнүүд:\n1) Шүлхий - вакцин жил бүр хийлгэх\n2) Боом - вакцин хийлгэх\n3) Бруцеллёз - сүүг буцалгаж уух\n4) Малын хорхой - улирал бүр эм өгөх\n5) Галзуу - зэрлэг амьтнаас хол байх\n\nЯаралтай эмчид хандах:\n- Өндөр халуун (40+)\n- Цус алдалт\n- Хоол иддэггүй 2+ хоног\n- Суулгалт\n- Амьсгал давчдах",
  "zud": "Зудын бэлтгэл:\n1) 8-р сараас өвс нөөцлөх\n2) Нөөцийн тэжээл бэлдэх\n3) Отрын бэлчээр тодорхойлох\n4) Хашаа бэхлэх, дулаалах\n5) Малын даатгалд хамрагдах\n6) Хөрш малчидтай хамтрах\n\nЗудын үед:\n- Малыг хашаанд тэжээх\n- Сул малыг тусгаарлах\n- Тэжээлийг хэмнэлттэй зарцуулах\n- Сумын штабтай холбоотой байх\n- Отор нүүх боломж хайх",
  "belcheer": "Бэлчээрийн менежмент:\n1) Улирлаар бэлчээр сэлгэх\n2) Хавар - өвөрт бэлчээр\n3) Зун - зуслангийн бэлчээр\n4) Намар - хаврын бэлчээр\n5) Өвөл - өвөлжөөний бэлчээр\n\nБэлчээр хамгаалах:\n- Хэт ачаалал өгөхгүй байх\n- Ургамал сэргэх хугацаа өгөх\n- Уст цэгийг хамгаалах",
  "zah": "Малын зах зээлийн зөвлөгөө:\n1) Намар борлуулах нь хамгийн ашигтай\n2) Мах: 10-11 сар хамгийн өндөр үнэ\n3) Ноолуур: 4-5 сар\n4) Ноос: 6-7 сар\n5) Арьс шир: жилийн турш\n\nҮнэ нэмэх арга:\n- Малыг тарчилгаанд оруулж зарах\n- Шууд үйлдвэрт зарах\n- Хоршоогоор дамжуулах\n- Онлайн зар ашиглах",
  "sankhuu": "Малчны санхүүгийн зөвлөгөө:\n1) Орлого зардлаа бүртгэх\n2) Улирлын орлогыг тэнцвэржүүлэх\n3) Нөөц сан байгуулах\n4) Даатгалд хамрагдах\n5) Зээлийг зөв ашиглах\n\nОрлогын эх үүсвэр:\n- Мах, сүү, ноолуур, ноос, арьс шир\n- Малын үржил\n- Тэжээлийн ургамал тариалах",
  "us": "Малын усны хэрэгцээ (өдөрт):\n- 1 хонь: 3-5 литр\n- 1 ямаа: 2-4 литр\n- 1 үхэр: 30-50 литр\n- 1 морь: 20-40 литр\n- 1 тэмээ: 40-60 литр\n\nӨвлийн ус:\n- Мөс хайлуулах\n- Худаг ашиглах\n- Цас идүүлэхгүй байх (энерги алдана)"
};
function findAnswer(q) {
  q = q.toLowerCase();
  if (q.match(/тура|turaa|turah|турах|тарга|tarга/)) return KB.turai || KB.tura;
  if (q.match(/төл|tol|birth|хээлт|тугал|хурга/)) return KB.tol;
  if (q.match(/ноолуур|nooluur|cashmere|самна/)) return KB.nooluur;
  if (q.match(/өвөл|uvul|winter|хүйтэн|өвөлж/)) return KB.uvul;
  if (q.match(/өвч|uvch|disease|sick|халуу|суулга|ханиа/)) return KB.uvchun;
  if (q.match(/зуд|zud|dzud|цас их|шуурга/)) return KB.zud;
  if (q.match(/бэлчээр|belcheer|ургамал|нүүдэл|отор/)) return KB.belcheer;
  if (q.match(/зах|zah|market|үнэ|зар|борлуул/)) return KB.zah;
  if (q.match(/санхүү|мөнгө|орлого|зардал|ашиг|зээл/)) return KB.sankhuu;
  if (q.match(/ус|us|water|худаг|мөс/)) return KB.us;
  return null;
}
router.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Asuult oruulna uu" });
  if (process.env.ANTHROPIC_API_KEY && client) {
    try {
      const msg = await client.messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 500, system: SYSTEM, messages: [{ role: "user", content: question }] });
      return res.json({ question, answer: msg.content[0].text, source: "claude" });
    } catch (e) { console.error("Claude error:", e.message); }
  }
  const answer = findAnswer(question) || "Уучлаарай, энэ асуултад хариулах мэдээлэл байхгүй байна. Дараах сэдвүүдээр асууж болно: малын эрүүл мэнд, тэжээл, ноолуур, өвөлжилт, зуд, бэлчээр, зах зээл, санхүү, усны хэрэгцээ.";
  res.json({ question, answer, source: "knowledge_base" });
});
router.get("/tips", async (req, res) => {
  if (process.env.ANTHROPIC_API_KEY && client) {
    try {
      const msg = await client.messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 150, system: SYSTEM, messages: [{ role: "user", content: "Onoodor malchind 1 bogino zuvluguu og. 1-2 oguulber." }] });
      return res.json({ tip: msg.content[0].text, source: "claude" });
    } catch (e) {}
  }
  const tips = [
    "Энэ 7 хоногт хүйтрэлт ихсэнэ. Малаа хашааны ойролцоо байлгаж, тэжээлийн нөөцөө шалгаарай.",
    "Хаврын төллөлтийн улирал ойртож байна. Хээлтэгч малдаа тэжээлийн нэмэлт өгч эхлээрэй.",
    "Ноолуурын ханш өмнөх жилээс 10% өссөн. 4-р сарын эхээр самнаж бэлдээрэй.",
    "Малын вакцины хуваарийг шалгаарай. Хаврын вакцинжуулалт удахгүй эхэлнэ.",
    "Бэлчээрийн ургамал сэргэж эхлэх хүртэл нөөцийн тэжээл ашиглаарай.",
    "Малын усны хангамжийг шалгаарай. 1 үхэрт өдөрт 30-50 литр ус хэрэгтэй.",
    "Өвлийн тэжээлийн нөөцөө тооцоолоорой. 1 хонинд өдөрт 2кг өвс хэрэгтэй.",
    "Малаа тарчилгаанд оруулж, намар зарвал илүү ашигтай."
  ];
  res.json({ tip: tips[Math.floor(Math.random() * tips.length)], source: "knowledge_base" });
});
// Өвчин оношлогч - шинж тэмдэгээр
const DIAGNOSE_SYSTEM = `Чи бол мал эмнэлгийн мэргэжлийн AI оношлогч. Малчдад тусална.

Хэрэглэгч малын шинж тэмдэгийг тайлбарлана. Чи:
1. Болзошгүй өвчнийг тодорхойл (1-3 сонголт, магадлалтай)
2. Нэн даруй хийх зүйл (яаралтай тусламж)
3. Эмчилгээний зөвлөгөө (гэрийн нөхцөлд)
4. Малын эмч дуудах шаардлагатай эсэх (Тийм/Үгүй)
5. Урьдчилан сэргийлэх арга

Монгол хэлээр, энгийн ойлгомжтой, алхамчилсан байдлаар хариулна.
Хэрэв ноцтой өвчин байж магадгүй бол "⚠️ ЯАРАЛТАЙ: Малын эмчид хандана уу" гэж заавал бич.`;

router.post("/diagnose", async (req, res) => {
  const { animal_type, symptoms, age, description } = req.body;
  if (!symptoms && !description) return res.status(400).json({ error: "Шинж тэмдэг оруулна уу" });

  const prompt = `Малын төрөл: ${animal_type || "тодорхойгүй"}
Нас: ${age || "тодорхойгүй"}
Шинж тэмдэг: ${symptoms || ""}
Нэмэлт тайлбар: ${description || ""}

Дээрх мэдээлэлд үндэслэн оношлогоо хий.`;

  if (process.env.ANTHROPIC_API_KEY && client) {
    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: DIAGNOSE_SYSTEM,
        messages: [{ role: "user", content: prompt }]
      });
      return res.json({ diagnosis: msg.content[0].text, source: "ai" });
    } catch (e) { console.error("Diagnose error:", e.message); }
  }

  // Fallback - DB-based diagnosis
  const animalMap = { "хонь": "sheep", "ямаа": "goat", "үхэр": "cattle", "адуу": "horse", "тэмээ": "camel", "sheep": "sheep", "goat": "goat", "cattle": "cattle", "horse": "horse", "camel": "camel" };
  const at = animalMap[(animal_type || "").toLowerCase()] || "";
  const searchText = ((symptoms || "") + " " + (description || "")).toLowerCase();

  let diseases;
  if (at) {
    diseases = db.prepare("SELECT * FROM animal_diseases WHERE animal_type = ?").all(at);
  } else {
    diseases = db.prepare("SELECT * FROM animal_diseases").all();
  }

  // Score diseases by symptom keyword match
  const scored = diseases.map(dis => {
    const matchText = (dis.symptoms + " " + dis.tags).toLowerCase();
    let score = 0;
    const keywords = searchText.split(/[,\s]+/).filter(k => k.length >= 2);
    keywords.forEach(kw => { if (matchText.includes(kw)) score += 2; });
    return { ...dis, score };
  }).filter(d => d.score > 0).sort((a, b) => b.score - a.score);

  let diagnosis = "";
  if (scored.length > 0) {
    const top = scored[0];
    const severityIcon = top.severity === "critical" ? "🔴" : top.severity === "high" ? "🟠" : "🟡";
    diagnosis = `${severityIcon} Болзошгүй оношлогоо: ${top.disease_name} (${top.disease_name_latin})\n\n`;
    diagnosis += `📋 Шинж тэмдэг:\n${top.symptoms}\n\n`;
    diagnosis += `💊 Эмчилгээ:\n${top.treatment}\n\n`;
    diagnosis += `🛡️ Урьдчилан сэргийлэх:\n${top.prevention}`;
    if (top.emergency) diagnosis += `\n\n⚠️ ЯАРАЛТАЙ: Малын эмчид нэн даруй хандана уу!`;
    if (top.contagious) diagnosis += `\n🔁 Халдварт өвчин - бусад малаас тусгаарлах!`;

    if (scored.length > 1) {
      diagnosis += "\n\n--- Бусад боломжит оношлогоо ---";
      scored.slice(1, 3).forEach(d => {
        const si = d.severity === "critical" ? "🔴" : d.severity === "high" ? "🟠" : "🟡";
        diagnosis += `\n${si} ${d.disease_name}: ${d.symptoms.split(';')[0]}`;
      });
    }
  } else {
    diagnosis = "Оношлогоо хийхэд мэдээлэл хангалтгүй байна.\n\nДараах мэдээллийг нэмж оруулна уу:\n- Малын төрөл, нас\n- Хэдэн өдрийн өмнөөс эхэлсэн\n- Хоол ус иддэг эсэх\n- Температур хэмжсэн эсэх\n- Бусад мал өвдсөн эсэх\n\nЭсвэл малын эмчид хандана уу.";
  }

  res.json({ diagnosis, source: "disease_db", matches: scored.slice(0, 5).map(d => ({ name: d.disease_name, severity: d.severity, score: d.score })) });
});

// Зургаар оношлох
router.post("/diagnose-image", async (req, res) => {
  const { image_base64, animal_type, description } = req.body;
  if (!image_base64) return res.status(400).json({ error: "Зураг оруулна уу" });

  if (process.env.ANTHROPIC_API_KEY && client) {
    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: DIAGNOSE_SYSTEM,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image_base64 } },
            { type: "text", text: `Энэ зураг дээр ${animal_type || "мал"}-ын шинж тэмдэг харагдаж байна. ${description || ""}\n\nЗурган дээрх шинж тэмдэгт үндэслэн оношлогоо хий.` }
          ]
        }]
      });
      return res.json({ diagnosis: msg.content[0].text, source: "ai_vision" });
    } catch (e) {
      console.error("Vision diagnose error:", e.message);
      return res.json({ diagnosis: "Зургийг боловсруулахад алдаа гарлаа. Шинж тэмдэгээ бичиж оношлуулна уу.", source: "error" });
    }
  }

  res.json({ diagnosis: "Зургаар оношлох боломж одоогоор идэвхгүй байна. Шинж тэмдэгээ бичиж оношлуулна уу.", source: "fallback" });
});

module.exports = router;