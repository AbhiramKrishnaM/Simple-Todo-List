import express from "express";
import {
  getAuthUrl,
  handleOAuthCallback,
  isCalendarAuthorized,
} from "../utils/googleAuth.js";

const router = express.Router();

// GET /api/calendar/auth - kicks off the one-time Google consent flow
router.get("/auth", (req, res) => {
  res.redirect(getAuthUrl());
});

// GET /api/calendar/oauth2callback - Google redirects here with a code
router.get("/oauth2callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Google authorization failed: ${error}`);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    await handleOAuthCallback(code);
    res.send("Google Calendar connected successfully. You can close this tab.");
  } catch (err) {
    console.error("Error completing Google OAuth flow:", err);
    res.status(500).send(`Failed to connect Google Calendar: ${err.message}`);
  }
});

// GET /api/calendar/status - check whether Calendar is connected
router.get("/status", async (req, res) => {
  try {
    const authorized = await isCalendarAuthorized();
    res.json({ success: true, authorized });
  } catch (error) {
    console.error("Error checking calendar authorization status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check calendar authorization status",
    });
  }
});

export default router;
