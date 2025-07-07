// Turso DB connection for Vercel/Node.js (production ready)
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  throw new Error('Turso DB environment variables not set. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
}

export const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});
