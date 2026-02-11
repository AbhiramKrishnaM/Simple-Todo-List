import express from "express";
import pool from "../db.js";
import { generateId } from "../utils/helpers.js";

const router = express.Router();

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY priority ASC, display_order ASC"
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
    const { title, priority, completed, meta, focus_duration } = req.body;

    // Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Task title is required",
      });
    }

    // Auto-assign priority if not provided
    // Find the lowest available priority among incomplete tasks
    let taskPriority;
    if (priority !== undefined && priority !== null) {
      taskPriority = Number(priority);
    } else {
      // Get all priorities from incomplete tasks, sorted
      const priorityResult = await pool.query(
        "SELECT priority FROM tasks WHERE completed = false ORDER BY priority ASC"
      );
      
      const existingPriorities = priorityResult.rows.map(row => row.priority);
      
      // Find the first gap in the sequence (starting from 1)
      taskPriority = 1;
      for (const existingPriority of existingPriorities) {
        if (existingPriority === taskPriority) {
          taskPriority++;
        } else {
          break;
        }
      }
    }

    // Create new task
    const newTask = {
      id: generateId(),
      title: title.trim(),
      timestamp: Date.now(),
      priority: taskPriority,
      completed: completed ?? false,
      meta: meta ?? {},
      focus_duration: focus_duration ?? null,
    };

    // Get the highest order and add 1
    const orderResult = await pool.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM tasks"
    );
    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO tasks (id, title, timestamp, priority, completed, meta, display_order, focus_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        newTask.id,
        newTask.title,
        newTask.timestamp,
        newTask.priority,
        newTask.completed,
        JSON.stringify(newTask.meta),
        nextOrder,
        newTask.focus_duration,
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
    const { title, priority, completed, meta, focus_duration } = req.body;

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
    if (focus_duration !== undefined) {
      updates.push(`focus_duration = $${paramCount++}`);
      values.push(focus_duration);
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

// PATCH update task focus duration
router.patch("/:id/focus-duration", async (req, res) => {
  try {
    const { id } = req.params;
    const { focus_duration } = req.body;

    // Validate focus_duration
    if (focus_duration !== null && focus_duration !== undefined) {
      if (typeof focus_duration !== "number" || focus_duration <= 0) {
        return res.status(400).json({
          success: false,
          error: "Focus duration must be a positive number (in minutes)",
        });
      }
    }

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

    // Update focus duration
    const result = await pool.query(
      `UPDATE tasks 
       SET focus_duration = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [focus_duration, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "Focus duration updated successfully",
    });
  } catch (error) {
    console.error("Error updating focus duration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update focus duration",
      message: error.message,
    });
  }
});

// PATCH toggle task completion
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    // First get the current task to check its completion status
    const currentTask = await pool.query(
      "SELECT completed FROM tasks WHERE id = $1",
      [id]
    );

    if (currentTask.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    const currentCompleted = currentTask.rows[0].completed;
    const newCompleted = !currentCompleted;

    // Update task with new completion status and completed_at timestamp
    // If marking as completed, set completed_at to now
    // If marking as incomplete, set completed_at to null
    const result = await pool.query(
      `UPDATE tasks 
       SET completed = $1, 
           completed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [newCompleted, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `Task ${newCompleted ? 'completed' : 'marked as incomplete'}`,
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

// PATCH bulk update task order
router.patch("/bulk-reorder", async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Tasks array is required",
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update each task's order
      for (const task of tasks) {
        if (!task.id || task.display_order === undefined) {
          throw new Error("Each task must have id and display_order");
        }
        
        await client.query(
          "UPDATE tasks SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [task.display_order, task.id]
        );
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Task order updated successfully",
        count: tasks.length,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating task order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update task order",
      message: error.message,
    });
  }
});

// PATCH assign priority to a task (with uniqueness handling)
router.patch("/:id/assign-priority", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { priority } = req.body;

    // Validation
    if (priority === undefined || priority === null) {
      return res.status(400).json({
        success: false,
        error: "Priority is required",
      });
    }

    const priorityNum = Number(priority);
    if (isNaN(priorityNum) || priorityNum < 1) {
      return res.status(400).json({
        success: false,
        error: "Priority must be a positive number",
      });
    }

    await client.query("BEGIN");

    // Check if task exists
    const taskResult = await client.query(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    );

    if (taskResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    const currentTask = taskResult.rows[0];

    // Check if another task already has this priority
    const existingTaskResult = await client.query(
      "SELECT * FROM tasks WHERE priority = $1 AND id != $2",
      [priorityNum, id]
    );

    if (existingTaskResult.rows.length > 0) {
      // Another task has this priority - swap their priorities
      const otherTask = existingTaskResult.rows[0];
      const currentTaskPriority = currentTask.priority;

      // Update the other task with the current task's priority
      await client.query(
        "UPDATE tasks SET priority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [currentTaskPriority, otherTask.id]
      );
    }

    // Update current task with new priority
    await client.query(
      "UPDATE tasks SET priority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [priorityNum, id]
    );

    await client.query("COMMIT");

    // Fetch all tasks to return updated state
    const allTasksResult = await pool.query(
      "SELECT * FROM tasks ORDER BY priority ASC, display_order ASC"
    );

    res.json({
      success: true,
      data: allTasksResult.rows,
      message: "Priority assigned successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error assigning priority:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign priority",
      message: error.message,
    });
  } finally {
    client.release();
  }
});

export default router;
