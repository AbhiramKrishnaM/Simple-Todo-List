import crypto from "crypto";
import { google } from "googleapis";
import pool from "../db.js";
import { getAuthorizedClient } from "./googleAuth.js";

const CALENDAR_ID = "primary";
// Google's documented max TTL for Calendar watch channels.
const WATCH_TTL_SECONDS = 7 * 24 * 60 * 60;

export const getCalendarClient = async () => {
  const auth = await getAuthorizedClient();
  return google.calendar({ version: "v3", auth });
};

export const getSyncState = async () => {
  const result = await pool.query(
    "SELECT * FROM calendar_sync_state LIMIT 1",
  );
  return result.rows[0] ?? null;
};

export const upsertSyncState = async (fields) => {
  const existing = await getSyncState();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (!existing) {
    const columns = keys.join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    await pool.query(
      `INSERT INTO calendar_sync_state (${columns}) VALUES (${placeholders})`,
      values,
    );
    return;
  }

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  await pool.query(
    `UPDATE calendar_sync_state SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${
      keys.length + 1
    }`,
    [...values, existing.id],
  );
};

// Tears down a previously registered channel so we don't leak channels
// against Google's per-project quota. Safe to ignore failures here - an
// already-expired/stopped channel 404s, which just means there's nothing to
// clean up.
const stopChannel = async (calendarClient, channelId, resourceId) => {
  if (!channelId || !resourceId) return;
  try {
    await calendarClient.channels.stop({
      requestBody: { id: channelId, resourceId },
    });
  } catch (err) {
    console.warn(
      "Could not stop previous watch channel (likely already expired):",
      err.message,
    );
  }
};

export const registerWatchChannel = async () => {
  const calendarClient = await getCalendarClient();
  const existingState = await getSyncState();

  await stopChannel(
    calendarClient,
    existingState?.channel_id,
    existingState?.resource_id,
  );

  const channelId = crypto.randomUUID();
  const channelToken = crypto.randomBytes(32).toString("hex");

  const response = await calendarClient.events.watch({
    calendarId: CALENDAR_ID,
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: process.env.CALENDAR_WEBHOOK_URL,
      token: channelToken,
      params: { ttl: String(WATCH_TTL_SECONDS) },
    },
  });

  const { resourceId, expiration } = response.data;

  await upsertSyncState({
    calendar_id: CALENDAR_ID,
    channel_id: channelId,
    resource_id: resourceId,
    channel_token: channelToken,
    expiration: expiration ? Number(expiration) : null,
    // Deliberately not touching sync_token - a fresh channel doesn't
    // invalidate our existing sync cursor.
  });

  return { channelId, resourceId, expiration: expiration ? Number(expiration) : null };
};

export const isChannelExpiringSoon = (state, withinMs = 24 * 60 * 60 * 1000) => {
  if (!state?.expiration) return true;
  return Number(state.expiration) - Date.now() < withinMs;
};

export const verifyWebhookRequest = async (headers) => {
  const state = await getSyncState();
  if (!state) return false;

  const channelId = headers["x-goog-channel-id"];
  const resourceId = headers["x-goog-resource-id"];
  const token = headers["x-goog-channel-token"];

  return (
    !!channelId &&
    !!resourceId &&
    !!token &&
    channelId === state.channel_id &&
    resourceId === state.resource_id &&
    token === state.channel_token
  );
};
