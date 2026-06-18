import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getVendorById, getVendorByLogin, Vendor } from "./db";

export const SESSION_COOKIE = "easycom_vendor_id";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getCurrentVendor(): Promise<Vendor | null> {
  const store = await cookies();
  const vendorId = store.get(SESSION_COOKIE)?.value;
  if (!vendorId) return null;
  return getVendorById(vendorId) || null;
}

export async function getRequiredVendor() {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Unauthorized");
  return vendor;
}

export async function authenticateVendor(login: string, password: string) {
  const vendor = getVendorByLogin(login);
  if (!vendor) return null;
  const valid = await verifyPassword(password, vendor.password_hash);
  return valid ? vendor : null;
}
