const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// 6 тэмдэгтийн урилгын код үүсгэх
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Зөвхөн owner/admin эрхтэй эсэх шалгах
function isOwnerOrAdmin(userId, householdId) {
  const user = db.prepare("SELECT role, household_id FROM users WHERE id = ?").get(userId);
  if (!user || user.household_id !== householdId) return false;
  return user.role === "owner" || user.role === "admin";
}

const VALID_ROLES = ["owner", "admin", "herder", "vet", "member", "viewer"];

// ========== POST /create - Өрх үүсгэх ==========
router.post("/create", verifyToken, (req, res) => {
  const { name, aimag, sum, bag } = req.body;
  if (!name) return res.status(400).json({ error: "Өрхийн нэр заавал шаардлагатай" });

  // Хэрэглэгч аль хэдийн өрхөд бүртгэлтэй эсэх
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (user.household_id) return res.status(400).json({ error: "Та аль хэдийн өрхөд бүртгэлтэй байна. Эхлээд өрхөөсөө гарна уу." });

  const invite_code = generateInviteCode();

  const result = db.prepare(`
    INSERT INTO households (name, owner_id, aimag, sum, bag, invite_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, req.user.id, aimag || "", sum || "", bag || "", invite_code);

  // Хэрэглэгчийг өрхөд холбох
  db.prepare("UPDATE users SET household_id = ?, role = 'owner' WHERE id = ?").run(result.lastInsertRowid, req.user.id);

  const household = db.prepare("SELECT * FROM households WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ ok: true, household });
});

// ========== GET /my - Миний өрх ==========
router.get("/my", verifyToken, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user.household_id) return res.status(404).json({ error: "Та ямар нэг өрхөд бүртгэлгүй байна" });

  const household = db.prepare("SELECT * FROM households WHERE id = ?").get(user.household_id);
  if (!household) return res.status(404).json({ error: "Өрх олдсонгүй" });

  const members = db.prepare("SELECT id, name, phone, role, created_at FROM users WHERE household_id = ?").all(household.id);

  res.json({ ...household, members });
});

// ========== POST /join - Өрхөд нэгдэх ==========
router.post("/join", verifyToken, (req, res) => {
  const { invite_code, role } = req.body;
  if (!invite_code) return res.status(400).json({ error: "Урилгын код шаардлагатай" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (user.household_id) return res.status(400).json({ error: "Та аль хэдийн өрхөд бүртгэлтэй байна. Эхлээд өрхөөсөө гарна уу." });

  const household = db.prepare("SELECT * FROM households WHERE invite_code = ?").get(invite_code.toUpperCase());
  if (!household) return res.status(404).json({ error: "Урилгын код буруу байна" });

  const memberRole = role || "member";
  if (!VALID_ROLES.includes(memberRole) || memberRole === "owner") {
    return res.status(400).json({ error: "Буруу эрх. Зөвшөөрөгдсөн: admin, herder, vet, member, viewer" });
  }

  db.prepare("UPDATE users SET household_id = ?, role = ? WHERE id = ?").run(household.id, memberRole, req.user.id);

  res.json({ ok: true, message: "Өрхөд амжилттай нэгдлээ", household_id: household.id, role: memberRole });
});

// ========== PUT /members/:user_id/role - Гишүүний эрх өөрчлөх ==========
router.put("/members/:user_id/role", verifyToken, (req, res) => {
  const { role } = req.body;
  const targetUserId = parseInt(req.params.user_id);
  if (!role || !VALID_ROLES.includes(role)) return res.status(400).json({ error: "Буруу эрх. Зөвшөөрөгдсөн: owner, admin, herder, vet, member, viewer" });

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!currentUser.household_id) return res.status(400).json({ error: "Та өрхөд бүртгэлгүй байна" });

  if (!isOwnerOrAdmin(req.user.id, currentUser.household_id)) {
    return res.status(403).json({ error: "Зөвхөн эзэмшигч болон админ эрх өөрчлөх боломжтой" });
  }

  const targetUser = db.prepare("SELECT * FROM users WHERE id = ? AND household_id = ?").get(targetUserId, currentUser.household_id);
  if (!targetUser) return res.status(404).json({ error: "Гишүүн олдсонгүй" });

  // owner эрхийг зөвхөн одоогийн owner шилжүүлж чадна
  if (role === "owner" && currentUser.role !== "owner") {
    return res.status(403).json({ error: "Зөвхөн эзэмшигч owner эрх шилжүүлж чадна" });
  }

  // owner эрх шилжүүлбэл хуучин owner-г admin болгох
  if (role === "owner") {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(req.user.id);
    db.prepare("UPDATE households SET owner_id = ? WHERE id = ?").run(targetUserId, currentUser.household_id);
  }

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, targetUserId);

  res.json({ ok: true, message: "Эрх амжилттай өөрчлөгдлөө" });
});

// ========== DELETE /members/:user_id - Гишүүн хасах ==========
router.delete("/members/:user_id", verifyToken, (req, res) => {
  const targetUserId = parseInt(req.params.user_id);

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!currentUser.household_id) return res.status(400).json({ error: "Та өрхөд бүртгэлгүй байна" });

  if (!isOwnerOrAdmin(req.user.id, currentUser.household_id)) {
    return res.status(403).json({ error: "Зөвхөн эзэмшигч болон админ гишүүн хасах боломжтой" });
  }

  const targetUser = db.prepare("SELECT * FROM users WHERE id = ? AND household_id = ?").get(targetUserId, currentUser.household_id);
  if (!targetUser) return res.status(404).json({ error: "Гишүүн олдсонгүй" });

  if (targetUser.role === "owner") return res.status(400).json({ error: "Эзэмшигчийг хасах боломжгүй" });

  db.prepare("UPDATE users SET household_id = NULL, role = 'owner' WHERE id = ?").run(targetUserId);

  res.json({ ok: true, message: "Гишүүн амжилттай хасагдлаа" });
});

// ========== PUT / - Өрхийн мэдээлэл шинэчлэх ==========
router.put("/", verifyToken, (req, res) => {
  const { name, aimag, sum, bag } = req.body;

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!currentUser.household_id) return res.status(400).json({ error: "Та өрхөд бүртгэлгүй байна" });

  if (!isOwnerOrAdmin(req.user.id, currentUser.household_id)) {
    return res.status(403).json({ error: "Зөвхөн эзэмшигч болон админ мэдээлэл засах боломжтой" });
  }

  const household = db.prepare("SELECT * FROM households WHERE id = ?").get(currentUser.household_id);
  if (!household) return res.status(404).json({ error: "Өрх олдсонгүй" });

  db.prepare(`
    UPDATE households SET name = ?, aimag = ?, sum = ?, bag = ? WHERE id = ?
  `).run(
    name || household.name,
    aimag !== undefined ? aimag : household.aimag,
    sum !== undefined ? sum : household.sum,
    bag !== undefined ? bag : household.bag,
    household.id
  );

  const updated = db.prepare("SELECT * FROM households WHERE id = ?").get(household.id);
  res.json({ ok: true, household: updated });
});

// ========== GET /invite-code - Урилгын код шинэчлэх ==========
router.get("/invite-code", verifyToken, (req, res) => {
  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!currentUser.household_id) return res.status(400).json({ error: "Та өрхөд бүртгэлгүй байна" });

  if (!isOwnerOrAdmin(req.user.id, currentUser.household_id)) {
    return res.status(403).json({ error: "Зөвхөн эзэмшигч болон админ урилгын код шинэчлэх боломжтой" });
  }

  const newCode = generateInviteCode();
  db.prepare("UPDATE households SET invite_code = ? WHERE id = ?").run(newCode, currentUser.household_id);

  res.json({ ok: true, invite_code: newCode });
});

// ========== DELETE /leave - Өрхөөс гарах ==========
router.delete("/leave", verifyToken, (req, res) => {
  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!currentUser.household_id) return res.status(400).json({ error: "Та өрхөд бүртгэлгүй байна" });

  const householdId = currentUser.household_id;

  if (currentUser.role === "owner") {
    // Бусад гишүүд байгаа эсэх
    const otherMembers = db.prepare("SELECT * FROM users WHERE household_id = ? AND id != ? ORDER BY created_at ASC").all(householdId, req.user.id);

    if (otherMembers.length > 0) {
      // Хамгийн эртний гишүүнд owner эрх шилжүүлэх
      const newOwner = otherMembers[0];
      db.prepare("UPDATE users SET role = 'owner' WHERE id = ?").run(newOwner.id);
      db.prepare("UPDATE households SET owner_id = ? WHERE id = ?").run(newOwner.id, householdId);
    } else {
      // Ганц гишүүн бол өрхийг устгах
      db.prepare("DELETE FROM households WHERE id = ?").run(householdId);
    }
  }

  db.prepare("UPDATE users SET household_id = NULL, role = 'owner' WHERE id = ?").run(req.user.id);

  res.json({ ok: true, message: "Өрхөөс амжилттай гарлаа" });
});

// ========== GET /stats - Өрхийн статистик ==========
router.get("/stats", verifyToken, (req, res) => {
  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!currentUser.household_id) return res.status(400).json({ error: "Та өрхөд бүртгэлгүй байна" });

  const householdId = currentUser.household_id;

  // Нийт гишүүд
  const totalMembers = db.prepare("SELECT COUNT(*) as count FROM users WHERE household_id = ?").get(householdId).count;

  // Өрхийн бүх гишүүдийн user_id-ууд
  const memberIds = db.prepare("SELECT id FROM users WHERE household_id = ?").all(householdId).map(m => m.id);

  let totalAnimals = 0;
  let byType = [];

  if (memberIds.length > 0) {
    const placeholders = memberIds.map(() => "?").join(",");

    // Нийт мал
    totalAnimals = db.prepare(`SELECT COUNT(*) as count FROM animals WHERE user_id IN (${placeholders}) AND status = 'active'`).get(...memberIds).count;

    // Малын төрлөөр
    byType = db.prepare(`SELECT animal_type, COUNT(*) as count FROM animals WHERE user_id IN (${placeholders}) AND status = 'active' GROUP BY animal_type`).all(...memberIds);
  }

  res.json({
    total_members: totalMembers,
    total_animals: totalAnimals,
    livestock_by_type: byType
  });
});

module.exports = router;
