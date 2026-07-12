import { google } from "googleapis";
import pool from "../db.js";

// calendar.events covers both reading and writing events (title updates for
// the completion marker), so it replaces the earlier readonly-only scope.
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const createOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

// Google only sends refresh_token on the very first consent (or when we
// force prompt=consent), so later responses must not clobber the one we
// already stored.
const saveTokens = async (tokens) => {
  const existing = await pool.query("SELECT id FROM calendar_auth LIMIT 1");
  const accessTokenExpiry = tokens.expiry_date ?? null;

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO calendar_auth (refresh_token, access_token, access_token_expiry, scope)
       VALUES ($1, $2, $3, $4)`,
      [
        tokens.refresh_token ?? null,
        tokens.access_token ?? null,
        accessTokenExpiry,
        tokens.scope ?? null,
      ],
    );
    return;
  }

  const fields = [
    "access_token = $1",
    "access_token_expiry = $2",
    "scope = $3",
    "updated_at = CURRENT_TIMESTAMP",
  ];
  const params = [
    tokens.access_token ?? null,
    accessTokenExpiry,
    tokens.scope ?? null,
  ];

  if (tokens.refresh_token) {
    params.push(tokens.refresh_token);
    fields.push(`refresh_token = $${params.length}`);
  }

  params.push(existing.rows[0].id);
  await pool.query(
    `UPDATE calendar_auth SET ${fields.join(", ")} WHERE id = $${params.length}`,
    params,
  );
};

export const getAuthUrl = () =>
  createOAuth2Client().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures Google re-sends a refresh_token even on re-auth
    scope: SCOPES,
  });

export const handleOAuthCallback = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    const existing = await pool.query(
      "SELECT refresh_token FROM calendar_auth LIMIT 1",
    );
    if (!existing.rows[0]?.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Revoke app access at https://myaccount.google.com/permissions and try again.",
      );
    }
  }

  await saveTokens(tokens);
  return tokens;
};

export const isCalendarAuthorized = async () => {
  const result = await pool.query(
    "SELECT refresh_token FROM calendar_auth LIMIT 1",
  );
  return result.rows.length > 0 && !!result.rows[0].refresh_token;
};

// Returns an OAuth2Client with credentials loaded, auto-persisting any
// refreshed access token back to the DB so we don't re-hit Google's token
// endpoint more than necessary after a restart.
export const getAuthorizedClient = async () => {
  const result = await pool.query("SELECT * FROM calendar_auth LIMIT 1");
  const row = result.rows[0];

  if (!row?.refresh_token) {
    throw new Error(
      "Google Calendar is not connected yet. Visit /api/calendar/auth to connect it.",
    );
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: row.refresh_token,
    access_token: row.access_token,
    expiry_date: row.access_token_expiry ? Number(row.access_token_expiry) : undefined,
  });

  oauth2Client.on("tokens", (tokens) => {
    saveTokens({ ...tokens, refresh_token: tokens.refresh_token ?? row.refresh_token }).catch(
      (err) => console.error("Failed to persist refreshed Google tokens:", err),
    );
  });

  return oauth2Client;
};
