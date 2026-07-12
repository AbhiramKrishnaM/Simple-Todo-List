import express from "express";
import {
  getAuthUrl,
  handleOAuthCallback,
  isCalendarAuthorized,
} from "../utils/googleAuth.js";
import { getSyncState, verifyWebhookRequest } from "../utils/googleCalendar.js";

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

// GET /api/calendar/watch/status - inspect the active watch channel (no secrets)
router.get("/watch/status", async (req, res) => {
  try {
    const state = await getSyncState();
    if (!state) {
      return res.json({ success: true, active: false });
    }

    res.json({
      success: true,
      active: true,
      calendarId: state.calendar_id,
      channelId: state.channel_id,
      expiration: state.expiration ? Number(state.expiration) : null,
      expiresAt: state.expiration
        ? new Date(Number(state.expiration)).toISOString()
        : null,
      hasSyncToken: !!state.sync_token,
    });
  } catch (error) {
    console.error("Error fetching watch channel status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch watch channel status",
    });
  }
});

// POST /api/calendar/webhook - Google's push notification target.
// Google sends no body, just headers identifying the channel + resource
// state. We verify the channel/resource/token triple against what we
// registered before doing anything, and reject everything else with a bare
// 404 so the endpoint doesn't leak information to unauthenticated callers.
router.post("/webhook", async (req, res) => {
  try {
    const isValid = await verifyWebhookRequest(req.headers);
    if (!isValid) {
      return res.status(404).end();
    }

    const resourceState = req.headers["x-goog-resource-state"];

    if (resourceState === "sync") {
      // Initial handshake sent right after watch() registration - no
      // event data yet, nothing to sync.
      console.log("📅 Calendar webhook: channel verification ping received");
      return res.status(200).end();
    }

    console.log(
      `📅 Calendar webhook: change notification received (state=${resourceState})`,
    );
    // TODO (Phase 3): trigger an events.list sync using the stored syncToken here.

    res.status(200).end();
  } catch (error) {
    console.error("Error handling Calendar webhook:", error);
    // Still 200 so Google doesn't retry-storm us - the syncToken-based sync
    // in Phase 3 will catch up on the next successful notification regardless.
    res.status(200).end();
  }
});

export default router;
