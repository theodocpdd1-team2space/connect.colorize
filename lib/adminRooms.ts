import { ensureDb, now } from "./db";

export function getRooms(filters?: { status?: string; vendorId?: string; date?: string }) {
  const db = ensureDb() as any;
  return db
    .prepare(
      `SELECT rooms.*, vendors.vendor_name, vendors.email,
       (SELECT COUNT(*) FROM room_users_log WHERE room_users_log.room_id = rooms.id AND left_at IS NULL) as logged_connected_users
       FROM rooms JOIN vendors ON vendors.id = rooms.vendor_id
       ORDER BY rooms.created_at DESC LIMIT 500`
    )
    .all()
    .filter((room: any) => {
      const statusOk = !filters?.status || filters.status === "all" || room.status === filters.status;
      const vendorOk = !filters?.vendorId || room.vendor_id === filters.vendorId;
      const dateOk = !filters?.date || String(room.created_at).startsWith(filters.date);
      return statusOk && vendorOk && dateOk;
    });
}

export function endRoom(roomId: string) {
  const db = ensureDb() as any;
  db.prepare("UPDATE rooms SET status = 'ended', ended_at = ? WHERE id = ?").run(now(), roomId);
}

export function resetRoom(roomId: string) {
  const db = ensureDb() as any;
  db.prepare("UPDATE room_users_log SET left_at = ? WHERE room_id = ? AND left_at IS NULL").run(now(), roomId);
}

export function getAdminStats(socketCount = 0) {
  const db = ensureDb() as any;
  const scalar = (sql: string) => db.prepare(sql).get().count;
  return {
    totalVendors: scalar("SELECT COUNT(*) as count FROM vendors"),
    activeLicenses: scalar("SELECT COUNT(*) as count FROM licenses WHERE status = 'active'"),
    trialVendors: scalar("SELECT COUNT(DISTINCT vendor_id) as count FROM licenses WHERE plan = 'trial'"),
    suspendedLicenses: scalar("SELECT COUNT(*) as count FROM licenses WHERE status = 'suspended'"),
    activeRooms: scalar("SELECT COUNT(*) as count FROM rooms WHERE status = 'active'"),
    roomsToday: scalar(`SELECT COUNT(*) as count FROM rooms WHERE date(created_at) = date('now')`),
    connectedUsersNow: socketCount
  };
}
