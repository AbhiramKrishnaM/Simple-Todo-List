import pool from "../db.js";
import {
  getCalendarClient,
  getSyncState,
  upsertSyncState,
  DONE_PREFIX,
} from "./googleCalendar.js";
import { generateId } from "./helpers.js";

const CALENDAR_ID = "primary";
// Bounds how far into the future a full resync (no sync token yet, or the
// previous one expired/was revoked) will pull events. Without this, a lost
// token turns the next resync into an unbounded pull of every future
// occurrence of every recurring event - years of daily standups included.
const SYNC_HORIZON_DAYS = 30;

const upsertTaskFromEvent = async (event, horizonCutoff) => {
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

  const rawTitle = event.summary || "(No title)";
  const title = rawTitle.startsWith(DONE_PREFIX)
    ? rawTitle.slice(DONE_PREFIX.length)
    : rawTitle;
  const startTime = event.start?.dateTime || event.start?.date;
  const timestamp = startTime ? new Date(startTime).getTime() : Date.now();
  // Calendar is the source of truth for its own description - mirrored into
  // notes on every sync, same as the title.
  const notes = event.description ?? "";

  if (existing.rows.length === 0) {
    // Only skip creating brand-new tasks for events beyond the horizon -
    // they'll get created on a later sync once they're in range. An
    // already-existing task is always updated below (even if a reschedule
    // pushed it out of range), so the horizon prune can catch it correctly.
    if (timestamp > horizonCutoff) return;

    const orderResult = await pool.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM tasks",
    );
    const nextOrder = orderResult.rows[0].next_order;

    await pool.query(
      `INSERT INTO tasks (id, title, timestamp, completed, meta, google_event_id, display_order)
       VALUES ($1, $2, $3, false, $4, $5, $6)`,
      [
        generateId(),
        title,
        timestamp,
        JSON.stringify({ source: "google_calendar", notes }),
        event.id,
        nextOrder,
      ],
    );
    return;
  }

  const meta = {
    ...(existing.rows[0].meta || {}),
    source: "google_calendar",
    notes,
  };
  await pool.query(
    `UPDATE tasks SET title = $1, timestamp = $2, meta = $3, updated_at = CURRENT_TIMESTAMP
     WHERE google_event_id = $4`,
    [title, timestamp, JSON.stringify(meta), event.id],
  );
};

// Prunes calendar-sourced tasks that fall outside the sync horizon. Mainly
// guards against a resync that happened before this horizon existed (or any
// future regression) leaving behind years of future recurring instances -
// safe to run on every sync since it only ever removes rows that shouldn't
// exist yet and will be recreated by a normal sync once they're in range.
const pruneOutOfHorizonTasks = async () => {
  const cutoff = Date.now() + SYNC_HORIZON_DAYS * 24 * 60 * 60 * 1000;
  const result = await pool.query(
    `DELETE FROM tasks WHERE meta->>'source' = 'google_calendar' AND timestamp > $1 RETURNING id`,
    [cutoff],
  );
  if (result.rows.length > 0) {
    console.log(
      `📅 Pruned ${result.rows.length} out-of-horizon calendar task(s)`,
    );
  }
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
      ? {
          calendarId: CALENDAR_ID,
          syncToken,
          singleEvents: true,
          ...(pageToken ? { pageToken } : {}),
        }
      : {
          calendarId: CALENDAR_ID,
          singleEvents: true,
          // First-ever sync only looks forward - we don't want to backfill
          // years of past events as tasks. Deliberately no timeMax here:
          // Calendar freezes whatever window generated a sync token, so
          // bounding this request would permanently cap what future
          // syncToken-based requests can ever return. The horizon is
          // enforced per-event below instead, which keeps the token itself
          // unbounded and correct indefinitely.
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

    const horizonCutoff = Date.now() + SYNC_HORIZON_DAYS * 24 * 60 * 60 * 1000;
    for (const event of response.data.items ?? []) {
      await upsertTaskFromEvent(event, horizonCutoff);
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

  await pruneOutOfHorizonTasks();

  return { processed };
};

// Delta sync (above) only reports an event at the moment something about it
// changes - it will never re-surface an event later just because time
// passed and it's now inside the horizon. This is a separate, plain
// "what's happening in the next SYNC_HORIZON_DAYS" query, run independently
// of the change-tracking sync token (its own nextSyncToken/nextPageToken
// cursor is deliberately discarded), so it catches anything that has newly
// rolled into range regardless of when it was created.
export const catchUpWindowedEvents = async () => {
  const calendarClient = await getCalendarClient();
  const horizonCutoff = Date.now() + SYNC_HORIZON_DAYS * 24 * 60 * 60 * 1000;

  let pageToken;
  let processed = 0;

  while (true) {
    const response = await calendarClient.events.list({
      calendarId: CALENDAR_ID,
      singleEvents: true,
      timeMin: new Date().toISOString(),
      timeMax: new Date(horizonCutoff).toISOString(),
      ...(pageToken ? { pageToken } : {}),
    });

    for (const event of response.data.items ?? []) {
      await upsertTaskFromEvent(event, horizonCutoff);
      processed++;
    }

    if (!response.data.nextPageToken) break;
    pageToken = response.data.nextPageToken;
  }

  return { processed };
};
