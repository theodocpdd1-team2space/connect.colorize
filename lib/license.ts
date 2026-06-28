import { APP_CONFIG } from "./config";
import { createLicense, getActiveLicensesForVendor, License, now, randomId } from "./db";

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function generateLicenseKey() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EC-2026-${part()}-${part()}`;
}

export function createTrialLicense(vendorId: string) {
  const start = new Date();
  const end = addDays(start, APP_CONFIG.freeTrialDays);
  return createLicense({
    vendorId,
    licenseKey: `TRIAL-${randomId("ec").toUpperCase()}`,
    plan: "trial",
    status: "active",
    maxUsers: APP_CONFIG.trialMaxUsers,
    recommendedUsers: APP_CONFIG.trialMaxUsers,
    maxActiveRooms: 1,
    lifetimeUse: false,
    trialStartedAt: start.toISOString(),
    trialEndsAt: end.toISOString()
  });
}

export function createPaidLicense(values: {
  vendorId: string;
  plan: "web_license" | "additional_room";
  maxUsers?: number;
  maxActiveRooms?: number;
  updateUntil?: string;
}) {
  return createLicense({
    vendorId: values.vendorId,
    licenseKey: generateLicenseKey(),
    plan: values.plan,
    status: "active",
    maxUsers: values.maxUsers || APP_CONFIG.webLicenseMaxUsers,
    recommendedUsers: APP_CONFIG.recommendedActiveUsers,
    maxActiveRooms: values.maxActiveRooms || APP_CONFIG.paidMaxActiveRooms,
    lifetimeUse: true,
    activatedAt: now(),
    updateUntil: values.updateUntil || addDays(new Date(), 365).toISOString()
  });
}

export function isLicenseUsable(license?: License | null) {
  if (!license || license.status !== "active") return false;
  if (license.plan === "trial" && license.trial_ends_at) {
    return new Date(license.trial_ends_at).getTime() >= Date.now();
  }
  return true;
}

export function getVendorEntitlement(vendorId: string) {
  const licenses = getActiveLicensesForVendor(vendorId).filter(isLicenseUsable);
  const primary = licenses.find((license) => license.plan === "web_license") || licenses.find((license) => license.plan === "trial") || licenses[0] || null;
  const maxActiveRooms = licenses.reduce((sum, license) => sum + Number(license.max_active_rooms || 0), 0);
  return {
    licenses,
    primary,
    maxActiveRooms: Math.max(maxActiveRooms, primary ? Number(primary.max_active_rooms) : 0),
    maxUsers: Number(primary?.max_users || 0),
    recommendedUsers: Number(primary?.recommended_users || APP_CONFIG.recommendedActiveUsers),
    usable: Boolean(primary && isLicenseUsable(primary))
  };
}

export function trialDaysRemaining(license?: License | null) {
  if (!license?.trial_ends_at) return null;
  const diff = new Date(license.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
