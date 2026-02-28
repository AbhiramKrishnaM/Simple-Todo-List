import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET settings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM settings LIMIT 1");

    const defaultRowColors = {
      very_urgent: "red",
      urgent: "yellow",
      medium: "blue",
      low: "green",
    };

    function rowColorsFromRow(row) {
      if (!row.row_colors || typeof row.row_colors !== "object") {
        return defaultRowColors;
      }
      return {
        very_urgent: row.row_colors.very_urgent ?? defaultRowColors.very_urgent,
        urgent: row.row_colors.urgent ?? defaultRowColors.urgent,
        medium: row.row_colors.medium ?? defaultRowColors.medium,
        low: row.row_colors.low ?? defaultRowColors.low,
      };
    }

    // If no settings exist, return default values
    if (result.rows.length === 0) {
      const defaultSettings = {
        numberOfTasks: 7,
        showRemainingTodoCount: true,
      };

      // Insert default settings
      const insertResult = await pool.query(
        "INSERT INTO settings (number_of_tasks, show_remaining_todo_count, row_colors) VALUES ($1, $2, $3) RETURNING *",
        [
          defaultSettings.numberOfTasks,
          defaultSettings.showRemainingTodoCount,
          JSON.stringify(defaultRowColors),
        ]
      );

      const row = insertResult.rows[0];
      return res.json({
        success: true,
        data: {
          numberOfTasks: row.number_of_tasks,
          showRemainingTodoCount: row.show_remaining_todo_count ?? true,
          rowColors: rowColorsFromRow(row),
        },
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        numberOfTasks: row.number_of_tasks,
        showRemainingTodoCount: row.show_remaining_todo_count ?? true,
        rowColors: rowColorsFromRow(row),
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
    const { numberOfTasks, showRemainingTodoCount, rowColors } = req.body;

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

    const validThemes = ["red", "yellow", "blue", "green"];
    const defaultRowColors = {
      very_urgent: "red",
      urgent: "yellow",
      medium: "blue",
      low: "green",
    };
    let rowColorsValue = defaultRowColors;
    if (
      rowColors &&
      typeof rowColors === "object" &&
      [rowColors.very_urgent, rowColors.urgent, rowColors.medium, rowColors.low].every(
        (v) => v == null || validThemes.includes(v)
      )
    ) {
      rowColorsValue = {
        very_urgent: rowColors.very_urgent ?? defaultRowColors.very_urgent,
        urgent: rowColors.urgent ?? defaultRowColors.urgent,
        medium: rowColors.medium ?? defaultRowColors.medium,
        low: rowColors.low ?? defaultRowColors.low,
      };
    }

    // Check if settings exist
    const checkResult = await pool.query("SELECT id FROM settings LIMIT 1");

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new settings
      result = await pool.query(
        "INSERT INTO settings (number_of_tasks, show_remaining_todo_count, row_colors) VALUES ($1, $2, $3) RETURNING *",
        [taskCount, showCount, JSON.stringify(rowColorsValue)]
      );
    } else {
      // Update existing settings
      result = await pool.query(
        "UPDATE settings SET number_of_tasks = $1, show_remaining_todo_count = $2, row_colors = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
        [
          taskCount,
          showCount,
          JSON.stringify(rowColorsValue),
          checkResult.rows[0].id,
        ]
      );
    }

    const row = result.rows[0];
    const rowColorsFromRow = (r) => ({
      very_urgent: r.row_colors?.very_urgent ?? defaultRowColors.very_urgent,
      urgent: r.row_colors?.urgent ?? defaultRowColors.urgent,
      medium: r.row_colors?.medium ?? defaultRowColors.medium,
      low: r.row_colors?.low ?? defaultRowColors.low,
    });
    res.json({
      success: true,
      data: {
        numberOfTasks: row.number_of_tasks,
        showRemainingTodoCount: row.show_remaining_todo_count ?? true,
        rowColors: rowColorsFromRow(row),
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
