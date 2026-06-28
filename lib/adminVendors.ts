import bcrypt from "bcryptjs";
import { ensureDb, now, randomId } from "./db";

type VendorInput = {
  vendorName: string;
  email: string;
  whatsapp: string;
  password?: string;
};

export function getVendors(filters?: { search?: string; status?: string }) {
  const db = ensureDb() as any;
  const rows = db
    .prepare(
      `SELECT vendors.*,
        (SELECT COUNT(*) FROM licenses WHERE licenses.vendor_id = vendors.id) as license_count,
        (SELECT COUNT(*) FROM rooms WHERE rooms.vendor_id = vendors.id AND rooms.status = 'active') as active_room_count,
        (SELECT plan FROM licenses WHERE licenses.vendor_id = vendors.id ORDER BY created_at DESC LIMIT 1) as current_plan,
        (SELECT status FROM licenses WHERE licenses.vendor_id = vendors.id ORDER BY created_at DESC LIMIT 1) as current_status
       FROM vendors
       ORDER BY created_at DESC`
    )
    .all();

  return rows.filter((vendor: any) => {
    const haystack = `${vendor.vendor_name} ${vendor.email} ${vendor.whatsapp}`.toLowerCase();
    const searchOk = !filters?.search || haystack.includes(filters.search.toLowerCase());
    const statusOk =
      !filters?.status ||
      filters.status === "all" ||
      vendor.current_status === filters.status ||
      vendor.current_plan === filters.status;
    return searchOk && statusOk;
  });
}

export function getVendorById(vendorId: string) {
  const db = ensureDb() as any;
  return db.prepare("SELECT * FROM vendors WHERE id = ?").get(vendorId);
}

export async function createVendor(input: VendorInput) {
  const db = ensureDb() as any;
  const id = randomId("ven");
  const timestamp = now();
  const passwordHash = await bcrypt.hash(input.password || "12345678", 10);
  db.prepare(
    `INSERT INTO vendors (id, vendor_name, email, whatsapp, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.vendorName, input.email.toLowerCase(), input.whatsapp, passwordHash, timestamp, timestamp);
  return getVendorById(id);
}

export function updateVendor(vendorId: string, input: Omit<VendorInput, "password">) {
  const db = ensureDb() as any;
  db.prepare("UPDATE vendors SET vendor_name = ?, email = ?, whatsapp = ?, updated_at = ? WHERE id = ?").run(
    input.vendorName,
    input.email.toLowerCase(),
    input.whatsapp,
    now(),
    vendorId
  );
  return getVendorById(vendorId);
}

export async function resetVendorPassword(vendorId: string, password: string) {
  const db = ensureDb() as any;
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare("UPDATE vendors SET password_hash = ?, updated_at = ? WHERE id = ?").run(passwordHash, now(), vendorId);
  return getVendorById(vendorId);
}

export function getVendorLicenses(vendorId: string) {
  const db = ensureDb() as any;
  return db.prepare("SELECT * FROM licenses WHERE vendor_id = ? ORDER BY created_at DESC").all(vendorId);
}

export function getVendorRooms(vendorId: string) {
  const db = ensureDb() as any;
  return db.prepare("SELECT * FROM rooms WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 100").all(vendorId);
}

export function setAllVendorLicensesStatus(vendorId: string, status: "active" | "suspended") {
  const db = ensureDb() as any;
  db.prepare("UPDATE licenses SET status = ?, updated_at = ? WHERE vendor_id = ?").run(status, now(), vendorId);
}
