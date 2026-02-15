// ============================================
// Activities Routes — CRUD + calendar summary
// ============================================
import { Router } from "express";
import pool from "../db.js";

const router = Router();

// -------------------------------------------------------
// GET /activities?farm_id=X&date=YYYY-MM-DD
// Returns activities for a given date on a farm,
// each decorated with its workers[] and inputs[].
// -------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { farm_id, date } = req.query;
    if (!farm_id || !date) {
      return res.status(400).json({ error: "farm_id and date are required" });
    }

    const result = await pool.query(
      `SELECT a.id, a.date, a.activity_type, a.remarks,
              z.id AS zone_id,   z.name AS zone_name,
              c.id AS crop_id,   c.name AS crop_name, c.variety AS crop_variety,
              u.name AS created_by_name
       FROM activities a
       LEFT JOIN zones z ON a.zone_id  = z.id
       LEFT JOIN crops c ON a.crop_id  = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.farm_id = $1 AND a.date = $2
       ORDER BY a.id`,
      [farm_id, date]
    );

    // Fetch workers + inputs for each activity in one go
    const activityIds = result.rows.map((r) => r.id);
    let workersMap = {};
    let inputsMap = {};

    if (activityIds.length > 0) {
      const wRes = await pool.query(
        `SELECT aw.activity_id, aw.hours,
                w.id AS worker_id, w.name AS worker_name
         FROM activity_workers aw
         JOIN workers w ON aw.worker_id = w.id
         WHERE aw.activity_id = ANY($1)`,
        [activityIds]
      );
      for (const row of wRes.rows) {
        if (!workersMap[row.activity_id]) workersMap[row.activity_id] = [];
        workersMap[row.activity_id].push({
          worker_id: row.worker_id,
          name: row.worker_name,
          hours: row.hours,
        });
      }

      const iRes = await pool.query(
        `SELECT ai.activity_id, ai.quantity, ai.unit, ai.method,
                i.id AS input_id, i.name AS input_name, i.type AS input_type
         FROM activity_inputs ai
         JOIN inputs i ON ai.input_id = i.id
         WHERE ai.activity_id = ANY($1)`,
        [activityIds]
      );
      for (const row of iRes.rows) {
        if (!inputsMap[row.activity_id]) inputsMap[row.activity_id] = [];
        inputsMap[row.activity_id].push({
          input_id: row.input_id,
          name: row.input_name,
          type: row.input_type,
          quantity: row.quantity,
          unit: row.unit,
          method: row.method,
        });
      }
    }

    const activities = result.rows.map((a) => ({
      ...a,
      workers: workersMap[a.id] || [],
      inputs: inputsMap[a.id] || [],
    }));

    res.json({ activities, date });
  } catch (err) {
    console.error("Fetch activities error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------
// GET /activities/calendar/:month?farm_id=X
// month format: YYYY-MM
// Returns { calendar: { "YYYY-MM-DD": [ ... ] } }
// -------------------------------------------------------
router.get("/calendar/:month", async (req, res) => {
  try {
    const { month } = req.params;
    const { farm_id } = req.query;
    if (!farm_id) return res.status(400).json({ error: "farm_id is required" });

    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = new Date(y, m, 0).toISOString().split("T")[0]; // last day

    const result = await pool.query(
      `SELECT a.id, a.date, a.activity_type,
              z.name AS zone_name,
              c.name AS crop_name
       FROM activities a
       LEFT JOIN zones z ON a.zone_id = z.id
       LEFT JOIN crops c ON a.crop_id = c.id
       WHERE a.farm_id = $1 AND a.date >= $2 AND a.date <= $3
       ORDER BY a.date, a.id`,
      [farm_id, startDate, endDate]
    );

    const calendar = {};
    for (const row of result.rows) {
      const dateKey = row.date.toISOString().split("T")[0];
      if (!calendar[dateKey]) calendar[dateKey] = [];
      calendar[dateKey].push({
        id: row.id,
        activity_type: row.activity_type,
        zone_name: row.zone_name,
        crop_name: row.crop_name,
      });
    }

    res.json({ month, calendar });
  } catch (err) {
    console.error("Calendar error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------
// POST /activities
// Body: { farm_id, zone_id, date, activity_type, crop_id,
//         remarks, created_by,
//         workers: [{ worker_id, hours }],
//         inputs:  [{ input_id, quantity, unit, method }] }
// -------------------------------------------------------
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      farm_id, zone_id, date, activity_type, crop_id,
      remarks, created_by, workers = [], inputs = [],
    } = req.body;

    if (!farm_id || !date || !activity_type) {
      return res.status(400).json({ error: "farm_id, date, and activity_type are required" });
    }

    await client.query("BEGIN");

    const actRes = await client.query(
      `INSERT INTO activities (farm_id, zone_id, date, activity_type, crop_id, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [farm_id, zone_id || null, date, activity_type, crop_id || null, remarks || null, created_by || null]
    );
    const activity = actRes.rows[0];

    for (const w of workers) {
      await client.query(
        `INSERT INTO activity_workers (activity_id, worker_id, hours) VALUES ($1,$2,$3)`,
        [activity.id, w.worker_id, w.hours || null]
      );
    }

    for (const inp of inputs) {
      await client.query(
        `INSERT INTO activity_inputs (activity_id, input_id, quantity, unit, method) VALUES ($1,$2,$3,$4,$5)`,
        [activity.id, inp.input_id, inp.quantity || null, inp.unit || null, inp.method || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ activity });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create activity error:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// -------------------------------------------------------
// DELETE /activities/:id
// -------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM activities WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Activity not found" });
    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete activity error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
