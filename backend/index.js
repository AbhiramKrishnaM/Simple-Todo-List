import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import pool, { initDatabase } from "./db.js";
import taskRoutes from "./routes/tasks.js";
import settingsRoutes from "./routes/settings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    "https://simple-todo-list-roan.vercel.app",
    "https://abhiramkrishna.com",
    "https://api.abhiramkrishna.com",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes

// Health check
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      message: "Server is running",
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Server is running but database is unavailable",
      database: "disconnected",
    });
  }
});

// Task routes
app.use("/api/tasks", taskRoutes);

// Settings routes
app.use("/api/settings", settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// Cron job to auto-delete completed tasks after 4 hours
const cleanupCompletedTasks = async () => {
  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const result = await pool.query(
      `DELETE FROM tasks 
       WHERE completed = true 
       AND completed_at IS NOT NULL 
       AND completed_at < $1 
       RETURNING id, title`,
      [fourHoursAgo]
    );

    if (result.rows.length > 0) {
      console.log(
        `🗑️  Auto-deleted ${result.rows.length} completed task(s):`,
        result.rows.map((row) => `"${row.title}"`).join(", ")
      );
    }
  } catch (error) {
    console.error("❌ Error in cleanup cron job:", error);
  }
};

// Schedule cron job to run every hour
// Cron pattern: '0 * * * *' means at minute 0 of every hour
cron.schedule("0 * * * *", cleanupCompletedTasks, {
  scheduled: true,
  timezone: "UTC",
});

console.log("⏰ Scheduled auto-deletion cron job to run every hour");

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();

    // Run cleanup immediately on startup (optional)
    await cleanupCompletedTasks();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 API endpoint: http://localhost:${PORT}/api/tasks`);
      console.log(
        `⏰ Auto-deletion: Completed tasks will be deleted after 4 hours`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
