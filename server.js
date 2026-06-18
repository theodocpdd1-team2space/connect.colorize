const fs = require("node:fs");
const http = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

function loadEnvFile() {
  if (!fs.existsSync(".env")) return;
  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const [rawKey, ...rest] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnvFile();

const {
  ensureDb,
  getRoomById,
  endRoom,
  logRoomUserJoined,
  logRoomUserLeft,
  logEvent,
  listVendors,
  listLicenses,
  listActiveRooms,
  getVendorByLogin,
  createLicense,
  updateLicense,
  now
} = require("./lib/db.cjs");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3010);
const platformAdminKey = process.env.PLATFORM_ADMIN_KEY || "change-this-admin-key";
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const io = new Server({
  serveClient: false
});

ensureDb();

const rooms = new Map();
const socketRooms = new Map();

function getRoomUsers(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function publicUsers(roomId) {
  return Array.from(getRoomUsers(roomId).values()).map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    speaking: user.speaking,
    joinedAt: user.joinedAt
  }));
}

function isTrialExpired(room) {
  return room.plan === "trial" && room.trial_ends_at && new Date(room.trial_ends_at).getTime() < Date.now();
}

function validateRoomJoin({ roomId, pin }) {
  const room = getRoomById(roomId);
  if (!room) return { ok: false, message: "Room does not exist." };
  if (room.status !== "active") return { ok: false, message: "Room has ended." };
  if (room.license_status !== "active" || isTrialExpired(room)) {
    return { ok: false, message: "License or trial is not active." };
  }
  if (room.pin_enabled && String(pin || "") !== String(room.room_pin || "")) {
    return { ok: false, message: "Room PIN is not valid." };
  }
  if (getRoomUsers(roomId).size >= Number(room.max_users)) {
    return { ok: false, message: "Room user limit reached." };
  }
  return { ok: true, room };
}

function emitRoomUsers(roomId) {
  io.to(roomId).emit("room-users", publicUsers(roomId));
  io.to("platform-admin").emit("admin-state", getAdminState());
  io.to(`monitor:${roomId}`).emit("room-monitor", {
    roomId,
    users: publicUsers(roomId),
    connectedUsers: getRoomUsers(roomId).size
  });
}

function leaveSocket(socket, reason = "left") {
  const roomId = socketRooms.get(socket.id);
  if (!roomId) return;
  const roomUsers = getRoomUsers(roomId);
  const user = roomUsers.get(socket.id);
  if (!user) return;
  roomUsers.delete(socket.id);
  socketRooms.delete(socket.id);
  socket.to(roomId).emit("user-left", { id: socket.id, reason });
  logRoomUserLeft(socket.id);
  logEvent({ vendorId: user.vendorId, roomId, type: "user-left", message: `${user.name} ${reason}` });
  emitRoomUsers(roomId);
}

function getAdminState() {
  return {
    vendors: listVendors(),
    licenses: listLicenses(),
    activeRooms: listActiveRooms(),
    socketCount: io.engine.clientsCount,
    version: "0.2.0-web"
  };
}

function makeLicenseKey() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EC-2026-${part()}-${part()}`;
}

io.on("connection", (socket) => {
  socket.emit("server-ready", { mode: "web", socketId: socket.id, version: "0.2.0-web" });

  socket.on("monitor-room", ({ roomId } = {}) => {
    if (!roomId) return;
    socket.join(`monitor:${roomId}`);
    socket.emit("room-monitor", {
      roomId,
      users: publicUsers(roomId),
      connectedUsers: getRoomUsers(roomId).size
    });
  });

  socket.on("admin-connect", ({ adminKey } = {}) => {
    if (String(adminKey || "") !== platformAdminKey) {
      socket.emit("admin-error", { message: "Invalid platform admin key." });
      return;
    }
    socket.join("platform-admin");
    socket.emit("admin-state", getAdminState());
  });

  socket.on("admin-generate-license", (payload = {}) => {
    if (String(payload.adminKey || "") !== platformAdminKey) return;
    const vendor = getVendorByLogin(payload.vendorLogin);
    if (!vendor) {
      socket.emit("admin-error", { message: "Vendor not found." });
      return;
    }
    const count = Math.max(1, Number(payload.numberOfLicenses || 1));
    for (let index = 0; index < count; index += 1) {
      createLicense({
        vendorId: vendor.id,
        licenseKey: makeLicenseKey(),
        plan: payload.plan || "web_license",
        status: "active",
        maxUsers: Number(payload.maxUsers || process.env.WEB_LICENSE_MAX_USERS || 50),
        recommendedUsers: Number(process.env.RECOMMENDED_ACTIVE_USERS || 12),
        maxActiveRooms: Number(payload.maxActiveRooms || 1),
        lifetimeUse: true,
        activatedAt: now(),
        updateUntil: payload.updateUntil || null
      });
    }
    socket.emit("admin-state", getAdminState());
  });

  socket.on("admin-suspend-license", ({ adminKey, licenseId } = {}) => {
    if (String(adminKey || "") !== platformAdminKey || !licenseId) return;
    updateLicense(licenseId, { status: "suspended" });
    socket.emit("admin-state", getAdminState());
  });

  socket.on("admin-extend-license", ({ adminKey, licenseId, updateUntil } = {}) => {
    if (String(adminKey || "") !== platformAdminKey || !licenseId) return;
    updateLicense(licenseId, { update_until: updateUntil || null });
    socket.emit("admin-state", getAdminState());
  });

  socket.on("admin-reset-room", ({ adminKey, roomId } = {}) => {
    if (String(adminKey || "") !== platformAdminKey || !roomId) return;
    io.to(roomId).emit("admin-reset-room", { message: "Room reset by platform admin." });
    getRoomUsers(roomId).clear();
    io.in(roomId).disconnectSockets(true);
    emitRoomUsers(roomId);
  });

  socket.on("room-ended", ({ adminKey, roomId } = {}) => {
    if (String(adminKey || "") !== platformAdminKey || !roomId) return;
    endRoom(roomId);
    io.to(roomId).emit("room-ended", { message: "Room ended." });
    getRoomUsers(roomId).clear();
    io.in(roomId).disconnectSockets(true);
    emitRoomUsers(roomId);
  });

  socket.on("join-room", (payload = {}) => {
    const roomId = String(payload.roomId || "").trim();
    const name = String(payload.name || "").trim();
    const role = String(payload.role || "").trim();
    const pin = String(payload.pin || "");

    if (!roomId || !name || !role) {
      socket.emit("join-error", { message: "Name, role, and room are required." });
      return;
    }

    const validation = validateRoomJoin({ roomId, pin });
    if (!validation.ok) {
      socket.emit("join-error", { message: validation.message });
      return;
    }

    const roomUsers = getRoomUsers(roomId);
    const user = {
      id: socket.id,
      roomId,
      vendorId: validation.room.vendor_id,
      name,
      role,
      speaking: false,
      joinedAt: new Date().toISOString(),
      userAgent: socket.handshake.headers["user-agent"] || ""
    };

    roomUsers.set(socket.id, user);
    socketRooms.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit("join-accepted", {
      selfId: socket.id,
      room: validation.room,
      users: publicUsers(roomId),
      iceServers: []
    });
    socket.to(roomId).emit("user-joined", user);
    logRoomUserJoined({ socketId: socket.id, roomId, name, role, joinedAt: user.joinedAt, userAgent: user.userAgent });
    logEvent({ vendorId: validation.room.vendor_id, roomId, type: "user-joined", message: `${name} joined as ${role}` });
    emitRoomUsers(roomId);
  });

  socket.on("webrtc-offer", ({ roomId, targetId, offer } = {}) => {
    if (socketRooms.get(socket.id) !== roomId || socketRooms.get(targetId) !== roomId) return;
    io.to(targetId).emit("webrtc-offer", { fromId: socket.id, offer });
  });

  socket.on("webrtc-answer", ({ roomId, targetId, answer } = {}) => {
    if (socketRooms.get(socket.id) !== roomId || socketRooms.get(targetId) !== roomId) return;
    io.to(targetId).emit("webrtc-answer", { fromId: socket.id, answer });
  });

  socket.on("ice-candidate", ({ roomId, targetId, candidate } = {}) => {
    if (socketRooms.get(socket.id) !== roomId || socketRooms.get(targetId) !== roomId) return;
    io.to(targetId).emit("ice-candidate", { fromId: socket.id, candidate });
  });

  socket.on("ptt-state", ({ roomId, speaking } = {}) => {
    if (socketRooms.get(socket.id) !== roomId) return;
    const user = getRoomUsers(roomId).get(socket.id);
    if (!user) return;
    user.speaking = Boolean(speaking);
    socket.to(roomId).emit("ptt-state", { userId: socket.id, speaking: user.speaking });
    emitRoomUsers(roomId);
  });

  socket.on("leave-room", () => {
    leaveSocket(socket, "left");
  });

  socket.on("disconnect", () => {
    leaveSocket(socket, "disconnected");
  });
});

app.prepare().then(() => {
  const httpServer = http.createServer((req, res) => handle(req, res));
  io.attach(httpServer);
  httpServer.listen(port, hostname, () => {
    console.log(`EasyCom Web ready on http://127.0.0.1:${port}`);
  });
});
