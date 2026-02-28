import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET settings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM settings LIMIT 1");

    // If no settings exist, return default values
    if (result.rows.length === 0) {
      const defaultSettings = {
        numberOfTasks: 7,
        showRemainingTodoCount: true,
      };

      // Insert default settings
      const insertResult = await pool.query(
        "INSERT INTO settings (number_of_tasks, show_remaining_todo_count) VALUES ($1, $2) RETURNING *",
        [defaultSettings.numberOfTasks, defaultSettings.showRemainingTodoCount]
      );

      const row = insertResult.rows[0];
      return res.json({
        success: true,
        data: {
          numberOfTasks: row.number_of_tasks,
          showRemainingTodoCount: row.show_remaining_todo_count ?? true,
        },
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        numberOfTasks: row.number_of_tasks,
        showRemainingTodoCount: row.show_remaining_todo_count ?? true,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings",
      message: error.message,
    });
  }
});

// PUT update settings
router.put("/", async (req, res) => {
  try {
    const { numberOfTasks, showRemainingTodoCount } = req.body;

    // Validation
    if (numberOfTasks === undefined || numberOfTasks === null) {
      return res.status(400).json({
        success: false,
        error: "numberOfTasks is required",
      });
    }

    const taskCount = Number(numberOfTasks);

    if (isNaN(taskCount) || taskCount < 1 || taskCount > 100) {
      return res.status(400).json({
        success: false,
        error: "numberOfTasks must be a number between 1 and 100",
      });
    }

    const showCount =
      showRemainingTodoCount === undefined
        ? true
        : Boolean(showRemainingTodoCount);

    // Check if settings exist
    const checkResult = await pool.query("SELECT id FROM settings LIMIT 1");

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new settings
      result = await pool.query(
        "INSERT INTO settings (number_of_tasks, show_remaining_todo_count) VALUES ($1, $2) RETURNING *",
        [taskCount, showCount]
      );
    } else {
      // Update existing settings
      result = await pool.query(
        "UPDATE settings SET number_of_tasks = $1, show_remaining_todo_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [taskCount, showCount, checkResult.rows[0].id]
      );
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        numberOfTasks: row.number_of_tasks,
        showRemainingTodoCount: row.show_remaining_todo_count ?? true,
      },
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update settings",
      message: error.message,
    });
  }
});

export default router;
