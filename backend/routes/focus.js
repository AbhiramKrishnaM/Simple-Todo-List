import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET active focus session
router.get("/active", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fs.*, t.title, t.focus_duration 
       FROM focus_sessions fs
       JOIN tasks t ON fs.task_id = t.id
       WHERE fs.is_active = true
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No active focus session",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching active focus session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active focus session",
      message: error.message,
    });
  }
});

// POST start focus session for a task
router.post("/:taskId/start", async (req, res) => {
  const client = await pool.connect();
  try {
    const { taskId } = req.params;

    await client.query("BEGIN");

    // Check if task exists
    const taskResult = await client.query(
      "SELECT * FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if there's already an active session
    const activeSessionResult = await client.query(
      "SELECT * FROM focus_sessions WHERE is_active = true"
    );

    // If there's an active session, stop it first
    if (activeSessionResult.rows.length > 0) {
      const activeSession = activeSessionResult.rows[0];
      
      // Calculate final elapsed time
      const startedAt = new Date(activeSession.started_at);
      const pausedAt = activeSession.paused_at
        ? new Date(activeSession.paused_at)
        : new Date();
      const sessionDuration = Math.floor((pausedAt - startedAt) / 1000);
      const totalElapsed = activeSession.elapsed_seconds + sessionDuration;

      await client.query(
        `UPDATE focus_sessions 
         SET is_active = false, 
             stopped_at = CURRENT_TIMESTAMP,
             elapsed_seconds = $1
         WHERE id = $2`,
        [totalElapsed, activeSession.id]
      );
    }

    // Create new focus session
    const newSessionResult = await client.query(
      `INSERT INTO focus_sessions (task_id, started_at)
       VALUES ($1, CURRENT_TIMESTAMP)
       RETURNING *`,
      [taskId]
    );

    await client.query("COMMIT");

    // Fetch session with task details
    const sessionResult = await pool.query(
      `SELECT fs.*, t.title, t.focus_duration 
       FROM focus_sessions fs
       JOIN tasks t ON fs.task_id = t.id
       WHERE fs.id = $1`,
      [newSessionResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      data: sessionResult.rows[0],
      message: "Focus session started",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error starting focus session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start focus session",
      message: error.message,
    });
  } finally {
    client.release();
  }
});

// POST pause focus session
router.post("/:taskId/pause", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get active session for this task
    const sessionResult = await pool.query(
      `SELECT * FROM focus_sessions 
       WHERE task_id = $1 AND is_active = true
       LIMIT 1`,
      [taskId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No active focus session found for this task",
      });
    }

    const session = sessionResult.rows[0];

    // Calculate elapsed time up to now
    const startedAt = new Date(session.started_at);
    const now = new Date();
    const sessionDuration = Math.floor((now - startedAt) / 1000);
    const totalElapsed = session.elapsed_seconds + sessionDuration;

    // Update session with paused_at timestamp and elapsed time
    const result = await pool.query(
      `UPDATE focus_sessions 
       SET paused_at = CURRENT_TIMESTAMP,
           elapsed_seconds = $1
       WHERE id = $2
       RETURNING *`,
      [totalElapsed, session.id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "Focus session paused",
    });
  } catch (error) {
    console.error("Error pausing focus session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to pause focus session",
      message: error.message,
    });
  }
});

// POST resume focus session
router.post("/:taskId/resume", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get paused session for this task
    const sessionResult = await pool.query(
      `SELECT * FROM focus_sessions 
       WHERE task_id = $1 AND is_active = true AND paused_at IS NOT NULL
       LIMIT 1`,
      [taskId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No paused focus session found for this task",
      });
    }

    const session = sessionResult.rows[0];

    // Resume: reset started_at to now and clear paused_at
    const result = await pool.query(
      `UPDATE focus_sessions 
       SET started_at = CURRENT_TIMESTAMP,
           paused_at = NULL
       WHERE id = $1
       RETURNING *`,
      [session.id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "Focus session resumed",
    });
  } catch (error) {
    console.error("Error resuming focus session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resume focus session",
      message: error.message,
    });
  }
});

// POST stop focus session
router.post("/:taskId/stop", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get active session for this task
    const sessionResult = await pool.query(
      `SELECT * FROM focus_sessions 
       WHERE task_id = $1 AND is_active = true
       LIMIT 1`,
      [taskId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No active focus session found for this task",
      });
    }

    const session = sessionResult.rows[0];

    // Calculate final elapsed time
    const startedAt = new Date(session.started_at);
    const now = new Date();
    
    // If session is paused, use elapsed_seconds as is
    // If not paused, calculate from started_at
    let totalElapsed = session.elapsed_seconds;
    if (!session.paused_at) {
      const sessionDuration = Math.floor((now - startedAt) / 1000);
      totalElapsed += sessionDuration;
    }

    // Stop session
    const result = await pool.query(
      `UPDATE focus_sessions 
       SET is_active = false,
           stopped_at = CURRENT_TIMESTAMP,
           elapsed_seconds = $1
       WHERE id = $2
       RETURNING *`,
      [totalElapsed, session.id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "Focus session stopped",
    });
  } catch (error) {
    console.error("Error stopping focus session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to stop focus session",
      message: error.message,
    });
  }
});

export default router;
