import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const db = require("./db.cjs");

export type Vendor = {
  id: string;
  vendor_name: string;
  email: string;
  whatsapp: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type License = {
  id: string;
  vendor_id: string;
  license_key: string;
  plan: "trial" | "web_license" | "additional_room";
  status: "active" | "expired" | "suspended";
  max_users: number;
  recommended_users: number;
  max_active_rooms: number;
  lifetime_use: 0 | 1;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  activated_at: string | null;
  update_until: string | null;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  vendor_id: string;
  license_id: string;
  event_name: string;
  room_pin: string | null;
  pin_enabled: 0 | 1;
  status: "active" | "ended";
  max_users: number;
  created_at: string;
  started_at: string;
  ended_at: string | null;
  vendor_name?: string;
  email?: string;
  plan?: string;
  license_status?: string;
  trial_ends_at?: string | null;
  max_active_rooms?: number;
  recommended_users?: number;
  logged_users?: number;
};

export const DB_PATH: string = db.DB_PATH;
export const ensureDb: () => unknown = db.ensureDb;
export const now: () => string = db.now;
export const randomId: (prefix: string) => string = db.randomId;
export const createVendor: (values: {
  vendorName: string;
  email: string;
  whatsapp: string;
  passwordHash: string;
}) => Vendor = db.createVendor;
export const getVendorById: (id: string) => Vendor | undefined = db.getVendorById;
export const getVendorByLogin: (login: string) => Vendor | undefined = db.getVendorByLogin;
export const createLicense: (values: Record<string, unknown>) => License = db.createLicense;
export const getLicenseById: (id: string) => License | undefined = db.getLicenseById;
export const getLicenseByKey: (key: string) => License | undefined = db.getLicenseByKey;
export const getActiveLicensesForVendor: (vendorId: string) => License[] = db.getActiveLicensesForVendor;
export const getPrimaryLicenseForVendor: (vendorId: string) => License | undefined = db.getPrimaryLicenseForVendor;
export const updateLicense: (id: string, values: Partial<License>) => License | undefined = db.updateLicense;
export const countActiveRoomsForVendor: (vendorId: string) => number = db.countActiveRoomsForVendor;
export const createRoom: (values: {
  vendorId: string;
  licenseId: string;
  eventName: string;
  roomPin?: string;
  pinEnabled?: boolean;
  maxUsers: number;
}) => Room = db.createRoom;
export const getRoomById: (id: string) => Room | undefined = db.getRoomById;
export const listRoomsForVendor: (vendorId: string) => Room[] = db.listRoomsForVendor;
export const endRoom: (roomId: string) => Room | undefined = db.endRoom;
export const logRoomUserJoined: (user: Record<string, unknown>) => void = db.logRoomUserJoined;
export const logRoomUserLeft: (socketId: string) => void = db.logRoomUserLeft;
export const logEvent: (event: { vendorId?: string | null; roomId?: string | null; type: string; message: string }) => void = db.logEvent;
export const listVendors: () => (Vendor & { license_count: number; active_room_count: number })[] = db.listVendors;
export const listLicenses: () => (License & { vendor_name: string; email: string; whatsapp: string })[] = db.listLicenses;
export const listActiveRooms: () => (Room & { vendor_name: string; email: string })[] = db.listActiveRooms;
