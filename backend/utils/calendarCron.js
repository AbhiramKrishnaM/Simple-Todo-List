import cron from "node-cron";
import { isCalendarAuthorized } from "./googleAuth.js";
import {
  getSyncState,
  registerWatchChannel,
  isChannelExpiringSoon,
} from "./googleCalendar.js";
import { syncCalendarEvents, catchUpWindowedEvents } from "./calendarSync.js";

const renewWatchChannelIfNeeded = async () => {
  try {
    const authorized = await isCalendarAuthorized();
    if (!authorized) {
      console.log(
        "📅 Skipping Calendar watch check: Calendar not connected yet (visit /api/calendar/auth).",
      );
      return;
    }

    const state = await getSyncState();
    if (!state || isChannelExpiringSoon(state)) {
      console.log("📅 Registering/renewing Google Calendar watch channel...");
      const result = await registerWatchChannel();
      console.log(
        `📅 Watch channel active until ${new Date(result.expiration).toISOString()}`,
      );
    }
  } catch (err) {
    console.error("❌ Error renewing Calendar watch channel:", err);
  }
};

// Runs an immediate check on boot (so we recover correctly if the channel
// expired while the app was down) and then re-checks daily. The daily job
// only actually re-registers when the channel is missing or within 24h of
// expiring, so this is cheap to run often.
export const startCalendarWatchRenewalJob = () => {
  renewWatchChannelIfNeeded();

  cron.schedule("0 3 * * *", renewWatchChannelIfNeeded, {
    scheduled: true,
    timezone: "UTC",
  });

  console.log(
    "⏰ Scheduled Calendar watch channel renewal check to run daily at 03:00 UTC",
  );
};

const pollCalendarEvents = async () => {
  try {
    const authorized = await isCalendarAuthorized();
    if (!authorized) return;

    const { processed } = await syncCalendarEvents();
    if (processed > 0) {
      console.log(`📅 Fallback poll synced ${processed} calendar event(s)`);
    }

    // Catches anything that has newly rolled inside the sync horizon -
    // delta sync alone can't do this, since it only reports an event once,
    // at the moment something about it actually changes.
    const { processed: inWindow } = await catchUpWindowedEvents();
    if (inWindow > 0) {
      console.log(`📅 Horizon catch-up checked ${inWindow} in-window event(s)`);
    }
  } catch (err) {
    console.error("❌ Error during fallback Calendar poll:", err);
  }
};

export const startCalendarPollingJob = () => {
  pollCalendarEvents();

  cron.schedule("*/15 * * * *", pollCalendarEvents, {
    scheduled: true,
  });

  console.log(
    "⏰ Scheduled Calendar fallback poll to run every 15 minutes",
  );
};
