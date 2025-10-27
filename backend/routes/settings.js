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
      };

      // Insert default settings
      const insertResult = await pool.query(
        "INSERT INTO settings (number_of_tasks) VALUES ($1) RETURNING *",
        [defaultSettings.numberOfTasks]
      );

      return res.json({
        success: true,
        data: {
          numberOfTasks: insertResult.rows[0].number_of_tasks,
        },
      });
    }

    res.json({
      success: true,
      data: {
        numberOfTasks: result.rows[0].number_of_tasks,
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
    const { numberOfTasks } = req.body;

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

    // Check if settings exist
    const checkResult = await pool.query("SELECT id FROM settings LIMIT 1");

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new settings
      result = await pool.query(
        "INSERT INTO settings (number_of_tasks) VALUES ($1) RETURNING *",
        [taskCount]
      );
    } else {
      // Update existing settings
      result = await pool.query(
        "UPDATE settings SET number_of_tasks = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [taskCount, checkResult.rows[0].id]
      );
    }

    res.json({
      success: true,
      data: {
        numberOfTasks: result.rows[0].number_of_tasks,
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
