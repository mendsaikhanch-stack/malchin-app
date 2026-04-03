const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Зөвшөөрөгдсөн хүснэгтүүд (whitelist)
const ALLOWED_TABLES = [
  "animals", "livestock", "livestock_events", "breeding_records",
  "birth_records", "health_records", "vaccination_records",
  "pastures", "grazing_records", "migrations", "finance_records", "reminders"
];

// Хүснэгт зөвшөөрөгдсөн эсэх шалгах
function isAllowedTable(table) {
  return ALLOWED_TABLES.includes(table);
}

// Бүртгэл тухайн хэрэглэгчийнх эсэх шалгах
function isOwnRecord(table, recordId, userId) {
  const row = db.prepare(`SELECT user_id FROM ${table} WHERE id = ?`).get(recordId);
  return row && row.user_id === userId;
}

// POST /push — Оффлайн өөрчлөлтүүдийг серверт илгээх
router.post("/push", verifyToken, (req, res) => {
  const { device_id, changes } = req.body;
  const userId = req.user.id;

  if (!changes || !Array.isArray(changes)) {
    return res.status(400).json({ error: "changes массив шаардлагатай" });
  }
  if (!device_id) {
    return res.status(400).json({ error: "device_id шаардлагатай" });
  }

  const errors = [];
  const idMappings = [];
  let syncedCount = 0;

  const logStmt = db.prepare(`
    INSERT INTO sync_log (user_id, table_name, record_id, action, data, synced, device_id, synced_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
  `);

  const pushTransaction = db.transaction(() => {
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const { table_name, action, record_id, data, created_at } = change;

      // Хүснэгт шалгах
      if (!isAllowedTable(table_name)) {
        errors.push({ index: i, error: `Зөвшөөрөгдөөгүй хүснэгт: ${table_name}` });
        continue;
      }

      // Action шалгах
      if (!["INSERT", "UPDATE", "DELETE"].includes(action)) {
        errors.push({ index: i, error: `Зөвшөөрөгдөөгүй action: ${action}` });
        continue;
      }

      try {
        let parsedData = {};
        if (data) {
          parsedData = typeof data === "string" ? JSON.parse(data) : data;
        }

        let newId = record_id;

        if (action === "INSERT") {
          // user_id-г заавал оруулах
          parsedData.user_id = userId;
          const clientTempId = record_id;

          const columns = Object.keys(parsedData);
          const placeholders = columns.map(() => "?").join(", ");
          const values = columns.map((col) => parsedData[col]);

          const result = db.prepare(
            `INSERT INTO ${table_name} (${columns.join(", ")}) VALUES (${placeholders})`
          ).run(...values);

          newId = Number(result.lastInsertRowid);
          idMappings.push({ table_name, client_temp_id: clientTempId, server_id: newId });

        } else if (action === "UPDATE") {
          // Эзэмшлийг шалгах
          if (!isOwnRecord(table_name, record_id, userId)) {
            errors.push({ index: i, error: "Зөвхөн өөрийн бүртгэлийг засах боломжтой" });
            continue;
          }

          const columns = Object.keys(parsedData).filter((col) => col !== "id" && col !== "user_id");
          if (columns.length === 0) {
            errors.push({ index: i, error: "Өөрчлөх өгөгдөл байхгүй" });
            continue;
          }
          const setClause = columns.map((col) => `${col} = ?`).join(", ");
          const values = columns.map((col) => parsedData[col]);

          db.prepare(`UPDATE ${table_name} SET ${setClause} WHERE id = ? AND user_id = ?`)
            .run(...values, record_id, userId);

        } else if (action === "DELETE") {
          // Эзэмшлийг шалгах
          if (!isOwnRecord(table_name, record_id, userId)) {
            errors.push({ index: i, error: "Зөвхөн өөрийн бүртгэлийг устгах боломжтой" });
            continue;
          }

          db.prepare(`DELETE FROM ${table_name} WHERE id = ? AND user_id = ?`)
            .run(record_id, userId);
        }

        // sync_log-д бүртгэх
        logStmt.run(
          userId,
          table_name,
          newId,
          action,
          typeof data === "string" ? data : JSON.stringify(parsedData),
          device_id
        );

        syncedCount++;
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }
  });

  try {
    pushTransaction();
    res.json({ ok: true, synced: syncedCount, id_mappings: idMappings, errors });
  } catch (err) {
    res.status(500).json({ error: "Sync амжилтгүй: " + err.message });
  }
});

// GET /pull — Сүүлийн sync-ээс хойших өөрчлөлтүүдийг татах
router.get("/pull", verifyToken, (req, res) => {
  const { since, device_id } = req.query;
  const userId = req.user.id;

  if (!since) {
    return res.status(400).json({ error: "since параметр шаардлагатай" });
  }
  if (!device_id) {
    return res.status(400).json({ error: "device_id параметр шаардлагатай" });
  }

  const rows = db.prepare(`
    SELECT * FROM sync_log
    WHERE user_id = ? AND created_at > ? AND device_id != ?
    ORDER BY created_at ASC
    LIMIT 500
  `).all(userId, since, device_id);

  res.json({ changes: rows, count: rows.length });
});

// GET /status — Хэрэглэгчийн sync статус
router.get("/status", verifyToken, (req, res) => {
  const userId = req.user.id;

  const lastSync = db.prepare(
    "SELECT MAX(synced_at) as last_synced_at FROM sync_log WHERE user_id = ? AND synced = 1"
  ).get(userId);

  const pending = db.prepare(
    "SELECT COUNT(*) as count FROM sync_log WHERE user_id = ? AND synced = 0"
  ).get(userId);

  const totalSynced = db.prepare(
    "SELECT COUNT(*) as count FROM sync_log WHERE user_id = ? AND synced = 1"
  ).get(userId);

  res.json({
    last_synced_at: lastSync.last_synced_at || null,
    pending_count: pending.count,
    total_synced: totalSynced.count
  });
});

// POST /resolve — Зөрчилдөөн шийдвэрлэх
router.post("/resolve", verifyToken, (req, res) => {
  const { conflicts } = req.body;
  const userId = req.user.id;

  if (!conflicts || !Array.isArray(conflicts)) {
    return res.status(400).json({ error: "conflicts массив шаардлагатай" });
  }

  const errors = [];
  let resolvedCount = 0;

  const resolveTransaction = db.transaction(() => {
    for (let i = 0; i < conflicts.length; i++) {
      const { sync_id, resolution, client_data } = conflicts[i];

      if (!["keep_server", "keep_client"].includes(resolution)) {
        errors.push({ index: i, error: "resolution нь keep_server эсвэл keep_client байх ёстой" });
        continue;
      }

      // sync_log бүртгэл олох
      const syncEntry = db.prepare(
        "SELECT * FROM sync_log WHERE id = ? AND user_id = ?"
      ).get(sync_id, userId);

      if (!syncEntry) {
        errors.push({ index: i, error: "Sync бүртгэл олдсонгүй" });
        continue;
      }

      try {
        if (resolution === "keep_client" && client_data) {
          const table_name = syncEntry.table_name;

          if (!isAllowedTable(table_name)) {
            errors.push({ index: i, error: `Зөвшөөрөгдөөгүй хүснэгт: ${table_name}` });
            continue;
          }

          const parsedData = typeof client_data === "string" ? JSON.parse(client_data) : client_data;
          const columns = Object.keys(parsedData).filter((col) => col !== "id" && col !== "user_id");

          if (columns.length > 0) {
            const setClause = columns.map((col) => `${col} = ?`).join(", ");
            const values = columns.map((col) => parsedData[col]);

            db.prepare(`UPDATE ${table_name} SET ${setClause} WHERE id = ? AND user_id = ?`)
              .run(...values, syncEntry.record_id, userId);
          }

          // sync_log-д шинэ бүртгэл нэмэх
          db.prepare(`
            INSERT INTO sync_log (user_id, table_name, record_id, action, data, synced, device_id, synced_at)
            VALUES (?, ?, ?, 'UPDATE', ?, 1, 'conflict_resolution', datetime('now'))
          `).run(userId, table_name, syncEntry.record_id, JSON.stringify(parsedData));
        }

        // Анхны sync_log бүртгэлийг шийдвэрлэгдсэн гэж тэмдэглэх
        db.prepare(
          "UPDATE sync_log SET synced = 1, synced_at = datetime('now') WHERE id = ?"
        ).run(sync_id);

        resolvedCount++;
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }
  });

  try {
    resolveTransaction();
    res.json({ ok: true, resolved: resolvedCount, errors });
  } catch (err) {
    res.status(500).json({ error: "Зөрчилдөөн шийдвэрлэхэд алдаа: " + err.message });
  }
});

module.exports = router;
