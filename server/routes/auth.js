// ============================================
// Auth Routes — simple role-based login
// ============================================
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * POST /auth/login
 * Body: { userId }
 * Returns: user object
 */
router.post("/login", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const result = await pool.query("SELECT id, name, phone, role FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /auth/users
 * Returns all users (for login selection screen)
 */
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, phone, role FROM users ORDER BY role, name"
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error("Fetch users error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
