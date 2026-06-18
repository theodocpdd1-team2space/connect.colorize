import { NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/auth";
import { countActiveRoomsForVendor, listRoomsForVendor } from "@/lib/db";
import { getVendorEntitlement, trialDaysRemaining } from "@/lib/license";

export const dynamic = "force-dynamic";

export async function GET() {
  const vendor = await getCurrentVendor();
  if (!vendor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const entitlement = getVendorEntitlement(vendor.id);
  return NextResponse.json({
    vendor,
    entitlement,
    trialDaysRemaining: trialDaysRemaining(entitlement.primary),
    activeRoomCount: countActiveRoomsForVendor(vendor.id),
    rooms: listRoomsForVendor(vendor.id)
  });
}
