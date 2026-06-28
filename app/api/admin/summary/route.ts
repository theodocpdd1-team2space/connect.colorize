import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { APP_CONFIG } from "@/lib/config";
import { DB_PATH } from "@/lib/db";
import { getLicenses } from "@/lib/adminLicenses";
import { getAdminStats, getRooms } from "@/lib/adminRooms";
import { getVendors } from "@/lib/adminVendors";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const rooms = getRooms({ status: "active" }).slice(0, 10);
  const vendors = getVendors().slice(0, 10);
  return NextResponse.json({
    stats: getAdminStats(0),
    recentVendors: vendors,
    activeRooms: rooms,
    licenses: getLicenses(),
    settings: {
      appUrl: APP_CONFIG.appUrl,
      appVersion: "0.2.0-web",
      freeTrialDays: APP_CONFIG.freeTrialDays,
      trialMaxUsers: APP_CONFIG.trialMaxUsers,
      webLicenseMaxUsers: APP_CONFIG.webLicenseMaxUsers,
      recommendedActiveUsers: APP_CONFIG.recommendedActiveUsers,
      socketStatus: "Available through Socket.IO server",
      databasePath: DB_PATH
    }
  });
}
