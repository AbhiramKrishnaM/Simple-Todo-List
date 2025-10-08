import express from "express";
import pool from "../db.js";
import { generateId } from "../utils/helpers.js";

const router = express.Router();

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY timestamp DESC"
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
      message: error.message,
    });
  }
});

// GET single task by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch task",
      message: error.message,
    });
  }
});

// POST create new task
router.post("/", async (req, res) => {
  try {
    const { title, priority, completed, meta } = req.body;

    // Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Task title is required",
      });
    }

    if (priority === undefined || priority === null) {
      return res.status(400).json({
        success: false,
        error: "Task priority is required",
      });
    }

    // Create new task
    const newTask = {
      id: generateId(),
      title: title.trim(),
      timestamp: Date.now(),
      priority: Number(priority),
      completed: completed ?? false,
      meta: meta ?? {},
    };

    const result = await pool.query(
      `INSERT INTO tasks (id, title, timestamp, priority, completed, meta)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        newTask.id,
        newTask.title,
        newTask.timestamp,
        newTask.priority,
        newTask.completed,
        JSON.stringify(newTask.meta),
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create task",
      message: error.message,
    });
  }
});

// PUT update task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, priority, completed, meta } = req.body;

    // Check if task exists
    const checkResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [
      id,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(Number(priority));
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
    }
    if (meta !== undefined) {
      updates.push(`meta = $${paramCount++}`);
      values.push(JSON.stringify(meta));
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE tasks 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update task",
      message: error.message,
    });
  }
});

// PATCH toggle task completion
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE tasks 
       SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Task completion toggled successfully",
    });
  } catch (error) {
    console.error("Error toggling task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle task",
      message: error.message,
    });
  }
});

// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete task",
      message: error.message,
    });
  }
});

// DELETE all tasks
router.delete("/", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM tasks RETURNING *");

    res.json({
      success: true,
      message: `Deleted ${result.rows.length} task(s) successfully`,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error deleting tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete tasks",
      message: error.message,
    });
  }
});

export default router;
