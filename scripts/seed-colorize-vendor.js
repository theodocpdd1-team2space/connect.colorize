#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rest] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = "./data/easycom.sqlite";
}

fs.mkdirSync(path.dirname(path.resolve(process.env.DATABASE_PATH)), { recursive: true });

const { ensureDb, randomId, now } = require("../lib/db.cjs");

const VENDOR_NAME = "Colorize Visual";
const WHATSAPP = "0895345902896";
const EMAIL = "theofilus267@gmail.com";
const PASSWORD = "12345678";
const PLAN = "trial";

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  const db = ensureDb();
  const timestamp = now();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const freeTrialDays = Number(process.env.FREE_TRIAL_DAYS || 7);
  const trialStartedAt = new Date();
  const trialEndsAt = addDays(trialStartedAt, freeTrialDays);
  const recommendedUsers = Number(process.env.RECOMMENDED_ACTIVE_USERS || 12);
  const trialMaxUsers = Number(process.env.TRIAL_MAX_USERS || 2);

  let vendor = db
    .prepare("SELECT * FROM vendors WHERE lower(email) = ? OR whatsapp = ?")
    .get(EMAIL.toLowerCase(), WHATSAPP);

  if (vendor) {
    db.prepare(
      `UPDATE vendors
       SET vendor_name = ?, email = ?, whatsapp = ?, password_hash = ?, updated_at = ?
       WHERE id = ?`
    ).run(VENDOR_NAME, EMAIL.toLowerCase(), WHATSAPP, passwordHash, timestamp, vendor.id);
  } else {
    const vendorId = randomId("ven");
    db.prepare(
      `INSERT INTO vendors (id, vendor_name, email, whatsapp, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(vendorId, VENDOR_NAME, EMAIL.toLowerCase(), WHATSAPP, passwordHash, timestamp, timestamp);
  }

  vendor = db
    .prepare("SELECT * FROM vendors WHERE lower(email) = ? OR whatsapp = ?")
    .get(EMAIL.toLowerCase(), WHATSAPP);

  const existingTrial = db
    .prepare("SELECT * FROM licenses WHERE vendor_id = ? AND plan = 'trial' ORDER BY created_at ASC LIMIT 1")
    .get(vendor.id);

  if (existingTrial) {
    db.prepare(
      `UPDATE licenses
       SET status = 'active',
           max_users = ?,
           recommended_users = ?,
           max_active_rooms = 1,
           lifetime_use = 0,
           trial_started_at = ?,
           trial_ends_at = ?,
           activated_at = NULL,
           update_until = NULL,
           updated_at = ?
       WHERE id = ?`
    ).run(
      trialMaxUsers,
      recommendedUsers,
      trialStartedAt.toISOString(),
      trialEndsAt.toISOString(),
      timestamp,
      existingTrial.id
    );
  } else {
    db.prepare(
      `INSERT INTO licenses (
        id, vendor_id, license_key, plan, status, max_users, recommended_users, max_active_rooms,
        lifetime_use, trial_started_at, trial_ends_at, activated_at, update_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', ?, ?, 1, 0, ?, ?, NULL, NULL, ?, ?)`
    ).run(
      randomId("lic"),
      vendor.id,
      `TRIAL-COLORIZE-${Date.now()}`,
      PLAN,
      trialMaxUsers,
      recommendedUsers,
      trialStartedAt.toISOString(),
      trialEndsAt.toISOString(),
      timestamp,
      timestamp
    );
  }

  console.log("Seed completed.");
  console.log("Vendor: Colorize Visual");
  console.log("Email: theofilus267@gmail.com");
  console.log("WhatsApp: 0895345902896");
  console.log("Password: 12345678");
  console.log("Plan: trial");
  console.log("Login URL: http://127.0.0.1:3010/login");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
