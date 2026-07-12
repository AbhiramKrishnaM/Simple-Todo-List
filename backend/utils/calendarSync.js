import pool from "../db.js";
import { getCalendarClient, getSyncState, upsertSyncState } from "./googleCalendar.js";
import { generateId } from "./helpers.js";

const CALENDAR_ID = "primary";

const upsertTaskFromEvent = async (event) => {
  const existing = await pool.query(
    "SELECT id, meta FROM tasks WHERE google_event_id = $1",
    [event.id],
  );

  if (event.status === "cancelled") {
    if (existing.rows.length === 0) {
      // Created and cancelled between syncs - no task was ever created for it.
      return;
    }
    const meta = { ...(existing.rows[0].meta || {}), cancelled_by_calendar: true };
    await pool.query(
      `UPDATE tasks
       SET completed = true, completed_at = CURRENT_TIMESTAMP, meta = $1, updated_at = CURRENT_TIMESTAMP
       WHERE google_event_id = $2`,
      [JSON.stringify(meta), event.id],
    );
    return;
  }

  const title = event.summary || "(No title)";
  const startTime = event.start?.dateTime || event.start?.date;
  const timestamp = startTime ? new Date(startTime).getTime() : Date.now();

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO tasks (id, title, timestamp, completed, meta, google_event_id)
       VALUES ($1, $2, $3, false, $4, $5)`,
      [
        generateId(),
        title,
        timestamp,
        JSON.stringify({ source: "google_calendar" }),
        event.id,
      ],
    );
    return;
  }

  const meta = { ...(existing.rows[0].meta || {}), source: "google_calendar" };
  await pool.query(
    `UPDATE tasks SET title = $1, timestamp = $2, meta = $3, updated_at = CURRENT_TIMESTAMP
     WHERE google_event_id = $4`,
    [title, timestamp, JSON.stringify(meta), event.id],
  );
};

// Pulls everything changed since the last sync (or does a full sync if we
// don't have a cursor yet / it's gone stale) and upserts a task per event.
export const syncCalendarEvents = async () => {
  const calendarClient = await getCalendarClient();
  const state = await getSyncState();

  let syncToken = state?.sync_token || undefined;
  let pageToken;
  let processed = 0;

  while (true) {
    const params = syncToken
      ? { calendarId: CALENDAR_ID, syncToken, ...(pageToken ? { pageToken } : {}) }
      : {
          calendarId: CALENDAR_ID,
          singleEvents: true,
          // First-ever sync only looks forward - we don't want to backfill
          // years of past events as tasks.
          timeMin: new Date().toISOString(),
          ...(pageToken ? { pageToken } : {}),
        };

    let response;
    try {
      response = await calendarClient.events.list(params);
    } catch (err) {
      const status = err.code || err.response?.status;
      if (status === 410) {
        console.warn("📅 Sync token expired/invalid - performing full resync");
        syncToken = undefined;
        pageToken = undefined;
        continue;
      }
      throw err;
    }

    for (const event of response.data.items ?? []) {
      await upsertTaskFromEvent(event);
      processed++;
    }

    if (response.data.nextPageToken) {
      pageToken = response.data.nextPageToken;
      continue;
    }

    if (response.data.nextSyncToken) {
      await upsertSyncState({ sync_token: response.data.nextSyncToken });
    }
    break;
  }

  return { processed };
};
