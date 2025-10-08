import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool, { initDatabase } from "./db.js";
import taskRoutes from "./routes/tasks.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ["*"],
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

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 API endpoint: http://localhost:${PORT}/api/tasks`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
