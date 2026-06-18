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
const EMAIL = "theofilus267@gmail.com";
const WHATSAPP = "0895345902896";
const PASSWORD = "12345678";
const LICENSE_KEY = "EC-COLORIZE-LIFETIME-2026";
const UPDATE_UNTIL = "2099-12-31T23:59:59.000Z";

async function main() {
  const db = ensureDb();
  const timestamp = now();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

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

  const conflictingLicense = db
    .prepare("SELECT * FROM licenses WHERE license_key = ? AND vendor_id != ?")
    .get(LICENSE_KEY, vendor.id);

  if (conflictingLicense) {
    throw new Error(`License key ${LICENSE_KEY} already belongs to another vendor.`);
  }

  const existingLifetime = db
    .prepare("SELECT * FROM licenses WHERE license_key = ?")
    .get(LICENSE_KEY);
  const existingVendorLicense = db
    .prepare("SELECT * FROM licenses WHERE vendor_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(vendor.id);
  const targetLicense = existingLifetime || existingVendorLicense;

  if (targetLicense) {
    db.prepare(
      `UPDATE licenses
       SET vendor_id = ?,
           license_key = ?,
           plan = 'web_license',
           status = 'active',
           max_users = 9999,
           recommended_users = 12,
           max_active_rooms = 999,
           lifetime_use = 1,
           trial_started_at = NULL,
           trial_ends_at = NULL,
           activated_at = ?,
           update_until = ?,
           updated_at = ?
       WHERE id = ?`
    ).run(vendor.id, LICENSE_KEY, timestamp, UPDATE_UNTIL, timestamp, targetLicense.id);
  } else {
    db.prepare(
      `INSERT INTO licenses (
        id, vendor_id, license_key, plan, status, max_users, recommended_users, max_active_rooms,
        lifetime_use, trial_started_at, trial_ends_at, activated_at, update_until, created_at, updated_at
      ) VALUES (?, ?, ?, 'web_license', 'active', 9999, 12, 999, 1, NULL, NULL, ?, ?, ?, ?)`
    ).run(randomId("lic"), vendor.id, LICENSE_KEY, timestamp, UPDATE_UNTIL, timestamp, timestamp);
  }

  db.prepare(
    `UPDATE licenses
     SET plan = 'web_license',
         status = 'active',
         max_users = 9999,
         recommended_users = 12,
         max_active_rooms = 999,
         lifetime_use = 1,
         trial_started_at = NULL,
         trial_ends_at = NULL,
         activated_at = COALESCE(activated_at, ?),
         update_until = ?,
         updated_at = ?
     WHERE vendor_id = ? AND license_key != ?`
  ).run(timestamp, UPDATE_UNTIL, timestamp, vendor.id, LICENSE_KEY);

  console.log("Colorize lifetime seed completed.");
  console.log("Login:");
  console.log("https://connect.colorizevisual.com/login");
  console.log("Email:");
  console.log("theofilus267@gmail.com");
  console.log("WhatsApp:");
  console.log("0895345902896");
  console.log("Password:");
  console.log("12345678");
  console.log("License:");
  console.log("EC-COLORIZE-LIFETIME-2026");
  console.log("Plan:");
  console.log("web_license lifetime");
  console.log("Max users:");
  console.log("9999");
  console.log("Max active rooms:");
  console.log("999");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
