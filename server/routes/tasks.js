// ============================================
// Task Routes — CRUD + calendar data
// ============================================
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * GET /tasks?date=YYYY-MM-DD&userId=X
 *
 * Returns tasks for a given date, INCLUDING carry-forward tasks.
 * Carry-forward logic:
 *   If scheduled_date < requested_date AND status = 'pending'
 *   → include in result with carry_forward = true
 */
router.get("/", async (req, res) => {
  try {
    const { date, userId } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: "date query param is required (YYYY-MM-DD)" });
    }

    // 1. Tasks actually scheduled for this date
    let scheduledQuery = `
      SELECT t.*, u.name as assigned_user_name, FALSE as carry_forward
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.scheduled_date = $1
    `;
    const params = [date];

    if (userId) {
      scheduledQuery += ` AND t.assigned_user_id = $2`;
      params.push(userId);
    }

    // 2. Carry-forward tasks: past pending tasks
    let carryQuery = `
      SELECT t.*, u.name as assigned_user_name, TRUE as carry_forward
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.scheduled_date < $1
        AND t.status = 'pending'
    `;
    const carryParams = [date];

    if (userId) {
      carryQuery += ` AND t.assigned_user_id = $2`;
      carryParams.push(userId);
    }

    const [scheduled, carryForward] = await Promise.all([
      pool.query(scheduledQuery, params),
      pool.query(carryQuery, carryParams),
    ]);

    // Combine both lists
    const tasks = [...carryForward.rows, ...scheduled.rows];

    res.json({ tasks, date });
  } catch (err) {
    console.error("Fetch tasks error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /tasks
 * Body: { title, assigned_user_id, scheduled_date }
 * Creates a new task (admin only)
 */
router.post("/", async (req, res) => {
  try {
    const { title, assigned_user_id, scheduled_date } = req.body;

    if (!title || !assigned_user_id || !scheduled_date) {
      return res
        .status(400)
        .json({
          error: "title, assigned_user_id, and scheduled_date are required",
        });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, assigned_user_id, scheduled_date, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [title, assigned_user_id, scheduled_date],
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error("Create task error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /tasks/:id/complete
 * Marks a task as completed with today's date
 */
router.patch("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `UPDATE tasks SET status = 'completed', completion_date = $1
       WHERE id = $2
       RETURNING *`,
      [today, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error("Complete task error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /calendar/:month
 * month format: YYYY-MM (e.g., 2025-03)
 *
 * Returns a summary of tasks per day for the calendar view.
 * Each day has a count + abbreviated labels.
 */
router.get("/calendar/:month", async (req, res) => {
  try {
    const { month } = req.params; // e.g. "2025-03"
    const { userId } = req.query;

    // Get the first and last day of the month
    const startDate = `${month}-01`;
    const endDate = new Date(
      parseInt(month.split("-")[0]),
      parseInt(month.split("-")[1]), // month is 1-indexed here, Date() expects 0-indexed but giving next month
      0, // day 0 = last day of previous month = last day of our target month
    )
      .toISOString()
      .split("T")[0];

    // Fetch all tasks in this month range
    let query = `
      SELECT t.id, t.title, t.scheduled_date, t.status, t.assigned_user_id,
             u.name as assigned_user_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.scheduled_date >= $1 AND t.scheduled_date <= $2
    `;
    const params = [startDate, endDate];

    if (userId) {
      query += ` AND t.assigned_user_id = $3`;
      params.push(userId);
    }

    query += ` ORDER BY t.scheduled_date`;

    const result = await pool.query(query, params);

    // Also fetch carry-forward tasks (pending tasks from before this month)
    let carryQuery = `
      SELECT t.id, t.title, t.scheduled_date, t.status, t.assigned_user_id,
             u.name as assigned_user_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.scheduled_date < $1 AND t.status = 'pending'
    `;
    const carryParams = [startDate];

    if (userId) {
      carryQuery += ` AND t.assigned_user_id = $2`;
      carryParams.push(userId);
    }

    const carryResult = await pool.query(carryQuery, carryParams);

    // Group tasks by date
    const calendar = {};
    for (const task of result.rows) {
      const dateKey = task.scheduled_date.toISOString().split("T")[0];
      if (!calendar[dateKey]) calendar[dateKey] = [];
      calendar[dateKey].push({
        id: task.id,
        title: task.title,
        status: task.status,
        assigned_user_name: task.assigned_user_name,
        carry_forward: false,
      });
    }

    // Add carry-forward count info
    const carryForwardCount = carryResult.rows.length;

    res.json({
      month,
      calendar,
      carryForwardCount,
      carryForwardTasks: carryResult.rows,
    });
  } catch (err) {
    console.error("Calendar error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
