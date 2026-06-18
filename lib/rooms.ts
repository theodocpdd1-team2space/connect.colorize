import { countActiveRoomsForVendor, createRoom, endRoom, getRoomById, listRoomsForVendor } from "./db";
import { getVendorEntitlement, isLicenseUsable } from "./license";

export function createVendorRoom(values: {
  vendorId: string;
  eventName: string;
  pinEnabled: boolean;
  roomPin?: string;
  maxUsers?: number;
}) {
  if (!values.eventName.trim()) {
    throw new Error("Event name is required.");
  }
  const entitlement = getVendorEntitlement(values.vendorId);
  if (!entitlement.usable || !entitlement.primary || !isLicenseUsable(entitlement.primary)) {
    throw new Error("License or trial is not active.");
  }
  const activeRooms = countActiveRoomsForVendor(values.vendorId);
  if (activeRooms >= entitlement.maxActiveRooms) {
    throw new Error("Active room limit reached. 1 license = 1 active room/session.");
  }
  const maxUsers = Math.min(Number(values.maxUsers || entitlement.maxUsers), entitlement.maxUsers);
  return createRoom({
    vendorId: values.vendorId,
    licenseId: entitlement.primary.id,
    eventName: values.eventName,
    pinEnabled: values.pinEnabled,
    roomPin: values.pinEnabled ? values.roomPin : "",
    maxUsers
  });
}

export function validateRoomForJoin(roomId: string, pin?: string) {
  const room = getRoomById(roomId);
  if (!room) return { ok: false as const, message: "Room does not exist." };
  if (room.status !== "active") return { ok: false as const, message: "Room has ended." };
  if (room.license_status !== "active") return { ok: false as const, message: "License or trial is not active." };
  if (room.plan === "trial" && room.trial_ends_at && new Date(room.trial_ends_at).getTime() < Date.now()) {
    return { ok: false as const, message: "Trial has expired." };
  }
  if (room.pin_enabled && String(pin || "") !== String(room.room_pin || "")) {
    return { ok: false as const, message: "Room PIN is not valid." };
  }
  return { ok: true as const, room };
}

export { endRoom, getRoomById, listRoomsForVendor };
