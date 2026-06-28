import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { APP_CONFIG } from "@/lib/config";
import { DB_PATH } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    settings: {
      appUrl: APP_CONFIG.appUrl,
      appVersion: "0.2.0-web",
      nodeEnv: process.env.NODE_ENV || "development",
      port: APP_CONFIG.port,
      freeTrialDays: APP_CONFIG.freeTrialDays,
      trialMaxUsers: APP_CONFIG.trialMaxUsers,
      webLicenseMaxUsers: APP_CONFIG.webLicenseMaxUsers,
      recommendedActiveUsers: APP_CONFIG.recommendedActiveUsers,
      paidMaxActiveRooms: APP_CONFIG.paidMaxActiveRooms,
      stunTurnStatus: `STUN ${process.env.ENABLE_STUN === "true" ? "on" : "off"} / TURN ${process.env.ENABLE_TURN === "true" ? "on" : "off"}`,
      socketStatus: "Socket.IO enabled",
      databasePath: DB_PATH
    }
  });
}
