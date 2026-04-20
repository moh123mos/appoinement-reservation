import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local file.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const lines = content
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

const entries = new Map();
for (const line of lines) {
  const separatorIndex = line.indexOf("=");
  if (separatorIndex === -1) {
    continue;
  }

  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  entries.set(key, value);
}

const requiredKeys = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_DEFAULT_TIMEZONE",
  "NEXT_PUBLIC_SLOT_MINUTES",
];

const missing = requiredKeys.filter((key) => !entries.get(key));

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const convexUrl = entries.get("NEXT_PUBLIC_CONVEX_URL");
if (!/^https:\/\//.test(convexUrl)) {
  console.error("NEXT_PUBLIC_CONVEX_URL must be an https URL.");
  process.exit(1);
}

const appEnv = entries.get("NEXT_PUBLIC_APP_ENV");
if (!["development", "staging", "production"].includes(appEnv)) {
  console.error("NEXT_PUBLIC_APP_ENV must be one of: development, staging, production.");
  process.exit(1);
}

const slotMinutes = Number(entries.get("NEXT_PUBLIC_SLOT_MINUTES"));
if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) {
  console.error("NEXT_PUBLIC_SLOT_MINUTES must be a positive integer.");
  process.exit(1);
}

const authIssuer = entries.get("CONVEX_AUTH_ISSUER_URL") ?? "";
const authAppId = entries.get("CONVEX_AUTH_APPLICATION_ID") ?? "";

if ((authIssuer && !authAppId) || (!authIssuer && authAppId)) {
  console.error("CONVEX_AUTH_ISSUER_URL and CONVEX_AUTH_APPLICATION_ID must be set together.");
  process.exit(1);
}

if (appEnv !== "development") {
  if (!authIssuer || !authAppId) {
    console.error("Auth vars are required outside development: CONVEX_AUTH_ISSUER_URL and CONVEX_AUTH_APPLICATION_ID.");
    process.exit(1);
  }

  if (!/^https:\/\//.test(authIssuer)) {
    console.error("CONVEX_AUTH_ISSUER_URL must be an https URL.");
    process.exit(1);
  }
}

console.log("Environment verification passed.");
