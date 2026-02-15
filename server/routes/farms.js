// ============================================
// Farms Routes — farms, zones, workers
// ============================================
import { Router } from "express";
import pool from "../db.js";

const router = Router();

// --- GET /farms?owner_id=X  ---
router.get("/", async (req, res) => {
  try {
    const { owner_id } = req.query;
    let result;
    if (owner_id) {
      result = await pool.query(
        "SELECT * FROM farms WHERE owner_id = $1 ORDER BY name", [owner_id]
      );
    } else {
      result = await pool.query("SELECT * FROM farms ORDER BY name");
    }
    res.json({ farms: result.rows });
  } catch (err) {
    console.error("Fetch farms error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- POST /farms ---
router.post("/", async (req, res) => {
  try {
    const { name, location, owner_id } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await pool.query(
      "INSERT INTO farms (name, location, owner_id) VALUES ($1,$2,$3) RETURNING *",
      [name, location || null, owner_id || null]
    );
    res.status(201).json({ farm: result.rows[0] });
  } catch (err) {
    console.error("Create farm error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- GET /farms/:id/zones ---
router.get("/:id/zones", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM zones WHERE farm_id = $1 ORDER BY name", [req.params.id]
    );
    res.json({ zones: result.rows });
  } catch (err) {
    console.error("Fetch zones error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- POST /farms/:id/zones ---
router.post("/:id/zones", async (req, res) => {
  try {
    const { name, area } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await pool.query(
      "INSERT INTO zones (farm_id, name, area) VALUES ($1,$2,$3) RETURNING *",
      [req.params.id, name, area || null]
    );
    res.status(201).json({ zone: result.rows[0] });
  } catch (err) {
    console.error("Create zone error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- GET /farms/:id/workers ---
router.get("/:id/workers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM workers WHERE farm_id = $1 ORDER BY name", [req.params.id]
    );
    res.json({ workers: result.rows });
  } catch (err) {
    console.error("Fetch workers error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- POST /farms/:id/workers ---
router.post("/:id/workers", async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await pool.query(
      "INSERT INTO workers (farm_id, name, phone) VALUES ($1,$2,$3) RETURNING *",
      [req.params.id, name, phone || null]
    );
    res.status(201).json({ worker: result.rows[0] });
  } catch (err) {
    console.error("Create worker error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
