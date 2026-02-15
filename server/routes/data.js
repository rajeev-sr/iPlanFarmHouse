// ============================================
// Data Routes — crops & inputs (reference data)
// ============================================
import { Router } from "express";
import pool from "../db.js";

const router = Router();

// --- GET /data/crops ---
router.get("/crops", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM crops ORDER BY name");
    res.json({ crops: result.rows });
  } catch (err) {
    console.error("Fetch crops error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- POST /data/crops ---
router.post("/crops", async (req, res) => {
  try {
    const { name, variety } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await pool.query(
      "INSERT INTO crops (name, variety) VALUES ($1,$2) RETURNING *",
      [name, variety || null]
    );
    res.status(201).json({ crop: result.rows[0] });
  } catch (err) {
    console.error("Create crop error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- GET /data/inputs ---
router.get("/inputs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM inputs ORDER BY type, name");
    res.json({ inputs: result.rows });
  } catch (err) {
    console.error("Fetch inputs error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- POST /data/inputs ---
router.post("/inputs", async (req, res) => {
  try {
    const { name, type, unit_default } = req.body;
    if (!name || !type) return res.status(400).json({ error: "name and type are required" });
    const result = await pool.query(
      "INSERT INTO inputs (name, type, unit_default) VALUES ($1,$2,$3) RETURNING *",
      [name, type, unit_default || null]
    );
    res.status(201).json({ input: result.rows[0] });
  } catch (err) {
    console.error("Create input error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
