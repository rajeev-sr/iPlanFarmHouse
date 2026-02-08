// ============================================
// Auth Routes — simple role-based login
// ============================================
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * POST /auth/login
 * Body: { role: "admin" | "worker", userId?: number }
 * Returns: user object
 *
 * In demo mode, just pick a user by role or specific ID
 */
router.post("/login", async (req, res) => {
  try {
    const { role, userId } = req.body;

    let result;
    if (userId) {
      // Login as specific user
      result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    } else {
      // Login as first user with this role
      result = await pool.query("SELECT * FROM users WHERE role = $1 LIMIT 1", [
        role,
      ]);
    }

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
 * Returns all users (for role selection screen)
 */
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, role FROM users ORDER BY role, name",
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error("Fetch users error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
