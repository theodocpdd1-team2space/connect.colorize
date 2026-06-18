import { NextResponse } from "next/server";
import { APP_CONFIG, getAppUrl, getIceServers } from "@/lib/config";
import { ensureDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureDb();
  return NextResponse.json({
    appVersion: "0.2.0-web",
    mode: "web",
    productName: APP_CONFIG.productName,
    tagline: APP_CONFIG.tagline,
    appUrl: getAppUrl(),
    port: APP_CONFIG.port,
    iceServers: getIceServers(),
    audioPolicy: "Server handles room and signaling only. Audio is designed for peer-to-peer connection when all crew are on the same Wi-Fi/hotspot."
  });
}
