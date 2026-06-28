export const APP_CONFIG = {
  productName: "Solusivendor EasyCom",
  tagline: "Easy connection. Clear communication. Better events.",
  appUrl: process.env.APP_URL || "https://easycom.vjmrtim.my.id",
  port: Number(process.env.PORT || 3010),
  platformAdminKey: process.env.PLATFORM_ADMIN_KEY || "change-this-admin-key",
  lynkIdCheckoutUrl: process.env.LYNK_ID_CHECKOUT_URL || "#",
  adminWhatsapp: process.env.ADMIN_WHATSAPP || "0895345902896",
  preferHostCandidates: process.env.PREFER_HOST_CANDIDATES !== "false",
  freeTrialDays: Number(process.env.FREE_TRIAL_DAYS || 7),
  trialMaxUsers: Number(process.env.TRIAL_MAX_USERS || 2),
  webLicenseMaxUsers: Number(process.env.WEB_LICENSE_MAX_USERS || 50),
  recommendedActiveUsers: Number(process.env.RECOMMENDED_ACTIVE_USERS || 12),
  paidMaxActiveRooms: Number(process.env.PAID_MAX_ACTIVE_ROOMS || 999),
  defaultRoomPin: process.env.DEFAULT_ROOM_PIN || ""
};

export function getAppUrl() {
  return APP_CONFIG.appUrl.replace(/\/$/, "");
}

export function getJoinUrl(roomId: string) {
  return `${getAppUrl()}/join/${roomId}`;
}

export function getIceServers() {
  const iceServers: RTCIceServer[] = [];
  if (process.env.ENABLE_STUN === "true" && process.env.STUN_URLS) {
    iceServers.push({ urls: process.env.STUN_URLS.split(",").map((url) => url.trim()).filter(Boolean) });
  }
  if (process.env.ENABLE_TURN === "true" && process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    });
  }
  return iceServers;
}
