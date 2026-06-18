const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const ROOT = process.cwd();
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, "data", "easycom.sqlite");
let db;

function now() {
  return new Date().toISOString();
}

function randomId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function ensureDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      whatsapp TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      license_key TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      max_users INTEGER NOT NULL,
      recommended_users INTEGER NOT NULL,
      max_active_rooms INTEGER NOT NULL,
      lifetime_use INTEGER NOT NULL,
      trial_started_at TEXT,
      trial_ends_at TEXT,
      activated_at TEXT,
      update_until TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      license_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      room_pin TEXT,
      pin_enabled INTEGER NOT NULL,
      status TEXT NOT NULL,
      max_users INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (license_id) REFERENCES licenses(id)
    );

    CREATE TABLE IF NOT EXISTS room_users_log (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      left_at TEXT,
      user_agent TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS events_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id TEXT,
      room_id TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  const eventColumns = db.prepare("PRAGMA table_info(events_log)").all().map((column) => column.name);
  if (!eventColumns.includes("vendor_id")) {
    db.exec("ALTER TABLE events_log ADD COLUMN vendor_id TEXT");
  }
  if (!eventColumns.includes("room_id")) {
    db.exec("ALTER TABLE events_log ADD COLUMN room_id TEXT");
  }
  return db;
}

function getDatabase() {
  return ensureDb();
}

function createVendor({ vendorName, email, whatsapp, passwordHash }) {
  const id = randomId("ven");
  const timestamp = now();
  ensureDb()
    .prepare(
      "INSERT INTO vendors (id, vendor_name, email, whatsapp, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(id, vendorName, email.toLowerCase(), whatsapp, passwordHash, timestamp, timestamp);
  return getVendorById(id);
}

function getVendorById(id) {
  return ensureDb().prepare("SELECT * FROM vendors WHERE id = ?").get(id);
}

function getVendorByLogin(login) {
  const value = String(login || "").trim().toLowerCase();
  return ensureDb().prepare("SELECT * FROM vendors WHERE lower(email) = ? OR whatsapp = ?").get(value, value);
}

function createLicense(values) {
  const id = randomId("lic");
  const timestamp = now();
  ensureDb()
    .prepare(
      `INSERT INTO licenses (
        id, vendor_id, license_key, plan, status, max_users, recommended_users, max_active_rooms,
        lifetime_use, trial_started_at, trial_ends_at, activated_at, update_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      values.vendorId,
      values.licenseKey,
      values.plan,
      values.status || "active",
      values.maxUsers,
      values.recommendedUsers,
      values.maxActiveRooms,
      values.lifetimeUse ? 1 : 0,
      values.trialStartedAt || null,
      values.trialEndsAt || null,
      values.activatedAt || null,
      values.updateUntil || null,
      timestamp,
      timestamp
    );
  return getLicenseById(id);
}

function getLicenseById(id) {
  return ensureDb().prepare("SELECT * FROM licenses WHERE id = ?").get(id);
}

function getActiveLicensesForVendor(vendorId) {
  return ensureDb()
    .prepare("SELECT * FROM licenses WHERE vendor_id = ? AND status = 'active' ORDER BY created_at ASC")
    .all(vendorId);
}

function getPrimaryLicenseForVendor(vendorId) {
  const licenses = getActiveLicensesForVendor(vendorId);
  return licenses.find((license) => license.plan === "web_license") || licenses.find((license) => license.plan === "trial") || licenses[0] || null;
}

function getLicenseByKey(licenseKey) {
  return ensureDb().prepare("SELECT * FROM licenses WHERE license_key = ?").get(licenseKey);
}

function updateLicense(id, values) {
  const current = getLicenseById(id);
  if (!current) return null;
  const next = { ...current, ...values, updated_at: now() };
  ensureDb()
    .prepare(
      `UPDATE licenses SET status = ?, max_users = ?, recommended_users = ?, max_active_rooms = ?,
       update_until = ?, updated_at = ? WHERE id = ?`
    )
    .run(next.status, next.max_users, next.recommended_users, next.max_active_rooms, next.update_until, next.updated_at, id);
  return getLicenseById(id);
}

function countActiveRoomsForVendor(vendorId) {
  return ensureDb().prepare("SELECT COUNT(*) as count FROM rooms WHERE vendor_id = ? AND status = 'active'").get(vendorId).count;
}

function createRoom(values) {
  const id = randomId("room");
  const timestamp = now();
  ensureDb()
    .prepare(
      `INSERT INTO rooms (
        id, vendor_id, license_id, event_name, room_pin, pin_enabled, status, max_users,
        created_at, started_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, NULL)`
    )
    .run(
      id,
      values.vendorId,
      values.licenseId,
      values.eventName,
      values.roomPin || null,
      values.pinEnabled ? 1 : 0,
      values.maxUsers,
      timestamp,
      timestamp
    );
  return getRoomById(id);
}

function getRoomById(id) {
  return ensureDb()
    .prepare(
      `SELECT rooms.*, vendors.vendor_name, vendors.email, licenses.plan, licenses.status as license_status,
       licenses.trial_ends_at, licenses.max_active_rooms, licenses.recommended_users
       FROM rooms
       JOIN vendors ON vendors.id = rooms.vendor_id
       JOIN licenses ON licenses.id = rooms.license_id
       WHERE rooms.id = ?`
    )
    .get(id);
}

function listRoomsForVendor(vendorId) {
  return ensureDb()
    .prepare(
      `SELECT rooms.*,
       (SELECT COUNT(*) FROM room_users_log WHERE room_users_log.room_id = rooms.id) as logged_users
       FROM rooms WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 25`
    )
    .all(vendorId);
}

function endRoom(roomId) {
  ensureDb().prepare("UPDATE rooms SET status = 'ended', ended_at = ? WHERE id = ?").run(now(), roomId);
  return getRoomById(roomId);
}

function logRoomUserJoined(user) {
  ensureDb()
    .prepare("INSERT OR REPLACE INTO room_users_log (id, room_id, name, role, joined_at, left_at, user_agent) VALUES (?, ?, ?, ?, ?, NULL, ?)")
    .run(user.socketId, user.roomId, user.name, user.role, user.joinedAt || now(), user.userAgent || "");
}

function logRoomUserLeft(socketId) {
  ensureDb().prepare("UPDATE room_users_log SET left_at = ? WHERE id = ?").run(now(), socketId);
}

function logEvent({ vendorId = null, roomId = null, type, message }) {
  ensureDb()
    .prepare("INSERT INTO events_log (vendor_id, room_id, type, message, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(vendorId, roomId, type, message, now());
}

function listVendors() {
  return ensureDb()
    .prepare(
      `SELECT vendors.*,
       (SELECT COUNT(*) FROM licenses WHERE licenses.vendor_id = vendors.id) as license_count,
       (SELECT COUNT(*) FROM rooms WHERE rooms.vendor_id = vendors.id AND rooms.status = 'active') as active_room_count
       FROM vendors ORDER BY created_at DESC LIMIT 200`
    )
    .all();
}

function listLicenses() {
  return ensureDb()
    .prepare(
      `SELECT licenses.*, vendors.vendor_name, vendors.email, vendors.whatsapp
       FROM licenses JOIN vendors ON vendors.id = licenses.vendor_id
       ORDER BY licenses.created_at DESC LIMIT 300`
    )
    .all();
}

function listActiveRooms() {
  return ensureDb()
    .prepare(
      `SELECT rooms.*, vendors.vendor_name, vendors.email
       FROM rooms JOIN vendors ON vendors.id = rooms.vendor_id
       WHERE rooms.status = 'active' ORDER BY rooms.started_at DESC`
    )
    .all();
}

module.exports = {
  DB_PATH,
  ensureDb,
  getDatabase,
  now,
  randomId,
  createVendor,
  getVendorById,
  getVendorByLogin,
  createLicense,
  getLicenseById,
  getLicenseByKey,
  getActiveLicensesForVendor,
  getPrimaryLicenseForVendor,
  updateLicense,
  countActiveRoomsForVendor,
  createRoom,
  getRoomById,
  listRoomsForVendor,
  endRoom,
  logRoomUserJoined,
  logRoomUserLeft,
  logEvent,
  listVendors,
  listLicenses,
  listActiveRooms
};
