import { APP_CONFIG } from "./config";
import { ensureDb, now, randomId } from "./db";
import { addDays, addYears, generateLicenseKey as makeKey } from "./licenseKey";

type Plan = "trial" | "web_license" | "additional_room" | "custom";

export function getLicenses(filters?: { plan?: string; status?: string; lifetime?: string }) {
  const db = ensureDb() as any;
  return db
    .prepare(
      `SELECT licenses.*, vendors.vendor_name, vendors.email, vendors.whatsapp
       FROM licenses JOIN vendors ON vendors.id = licenses.vendor_id
       ORDER BY licenses.created_at DESC`
    )
    .all()
    .filter((license: any) => {
      const planOk = !filters?.plan || filters.plan === "all" || license.plan === filters.plan;
      const statusOk = !filters?.status || filters.status === "all" || license.status === filters.status;
      const lifetimeOk =
        !filters?.lifetime ||
        filters.lifetime === "all" ||
        String(Boolean(license.lifetime_use)) === filters.lifetime;
      return planOk && statusOk && lifetimeOk;
    });
}

export function getLicenseById(licenseId: string) {
  const db = ensureDb() as any;
  return db
    .prepare(
      `SELECT licenses.*, vendors.vendor_name, vendors.email, vendors.whatsapp
       FROM licenses JOIN vendors ON vendors.id = licenses.vendor_id
       WHERE licenses.id = ?`
    )
    .get(licenseId);
}

export function getUniqueLicenseKey() {
  const db = ensureDb() as any;
  for (let index = 0; index < 20; index += 1) {
    const key = makeKey();
    const exists = db.prepare("SELECT id FROM licenses WHERE license_key = ?").get(key);
    if (!exists) return key;
  }
  throw new Error("Could not generate unique license key.");
}

export function defaultsForPlan(plan: Plan, overrides: any = {}) {
  const start = new Date();
  if (plan === "trial") {
    return {
      maxUsers: Number(overrides.maxUsers || APP_CONFIG.trialMaxUsers),
      recommendedUsers: Number(overrides.recommendedUsers || APP_CONFIG.trialMaxUsers),
      maxActiveRooms: Number(overrides.maxActiveRooms || 1),
      lifetimeUse: Boolean(overrides.lifetimeUse || false),
      trialStartedAt: start.toISOString(),
      trialEndsAt: overrides.trialEndsAt || addDays(start, Number(overrides.trialDays || APP_CONFIG.freeTrialDays)).toISOString(),
      activatedAt: null,
      updateUntil: overrides.updateUntil || null
    };
  }
  if (plan === "web_license" || plan === "additional_room") {
    return {
      maxUsers: Number(overrides.maxUsers || APP_CONFIG.webLicenseMaxUsers),
      recommendedUsers: Number(overrides.recommendedUsers || APP_CONFIG.recommendedActiveUsers),
      maxActiveRooms: Number(overrides.maxActiveRooms || APP_CONFIG.paidMaxActiveRooms),
      lifetimeUse: overrides.lifetimeUse === undefined ? true : Boolean(overrides.lifetimeUse),
      trialStartedAt: null,
      trialEndsAt: null,
      activatedAt: overrides.activatedAt || start.toISOString(),
      updateUntil: overrides.updateUntil || addYears(start, 1).toISOString()
    };
  }
  return {
    maxUsers: Number(overrides.maxUsers || APP_CONFIG.webLicenseMaxUsers),
    recommendedUsers: Number(overrides.recommendedUsers || APP_CONFIG.recommendedActiveUsers),
    maxActiveRooms: Number(overrides.maxActiveRooms || 1),
    lifetimeUse: Boolean(overrides.lifetimeUse),
    trialStartedAt: overrides.trialStartedAt || null,
    trialEndsAt: overrides.trialEndsAt || null,
    activatedAt: overrides.activatedAt || start.toISOString(),
    updateUntil: overrides.updateUntil || null
  };
}

export function createLicense(input: any) {
  const db = ensureDb() as any;
  const id = randomId("lic");
  const timestamp = now();
  const plan = (input.plan || "web_license") as Plan;
  const defaults = defaultsForPlan(plan, input);
  const licenseKey = input.licenseKey || getUniqueLicenseKey();
  db.prepare(
    `INSERT INTO licenses (
      id, vendor_id, license_key, plan, status, max_users, recommended_users, max_active_rooms,
      lifetime_use, trial_started_at, trial_ends_at, activated_at, update_until, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.vendorId,
    licenseKey,
    plan,
    input.status || "active",
    defaults.maxUsers,
    defaults.recommendedUsers,
    defaults.maxActiveRooms,
    defaults.lifetimeUse ? 1 : 0,
    defaults.trialStartedAt,
    defaults.trialEndsAt,
    defaults.activatedAt,
    defaults.updateUntil,
    timestamp,
    timestamp
  );
  return getLicenseById(id);
}

export function updateLicense(licenseId: string, input: any) {
  const db = ensureDb() as any;
  db.prepare(
    `UPDATE licenses SET license_key = ?, plan = ?, status = ?, max_users = ?, recommended_users = ?,
     max_active_rooms = ?, lifetime_use = ?, trial_ends_at = ?, update_until = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.licenseKey,
    input.plan,
    input.status,
    Number(input.maxUsers),
    Number(input.recommendedUsers),
    Number(input.maxActiveRooms),
    input.lifetimeUse ? 1 : 0,
    input.trialEndsAt || null,
    input.updateUntil || null,
    now(),
    licenseId
  );
  return getLicenseById(licenseId);
}

export function suspendLicense(licenseId: string) {
  const db = ensureDb() as any;
  db.prepare("UPDATE licenses SET status = 'suspended', updated_at = ? WHERE id = ?").run(now(), licenseId);
}

export function activateLicense(licenseId: string) {
  const db = ensureDb() as any;
  db.prepare("UPDATE licenses SET status = 'active', updated_at = ? WHERE id = ?").run(now(), licenseId);
}

export function extendLicenseOneYear(licenseId: string) {
  const db = ensureDb() as any;
  db.prepare("UPDATE licenses SET update_until = ?, updated_at = ? WHERE id = ?").run(addYears(new Date(), 1).toISOString(), now(), licenseId);
}

export function resetLicenseActiveRooms(licenseId: string) {
  const db = ensureDb() as any;
  db.prepare("UPDATE rooms SET status = 'ended', ended_at = ? WHERE license_id = ? AND status = 'active'").run(now(), licenseId);
}

export function deleteLicenseIfSafe(licenseId: string) {
  const db = ensureDb() as any;
  const active = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE license_id = ? AND status = 'active'").get(licenseId).count;
  if (active > 0) throw new Error("Cannot delete license with active room.");
  db.prepare("DELETE FROM licenses WHERE id = ?").run(licenseId);
}
