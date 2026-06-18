import { NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/auth";
import { createVendorRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const vendor = await getCurrentVendor();
  if (!vendor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const room = createVendorRoom({
      vendorId: vendor.id,
      eventName: String(body.eventName || "").trim(),
      pinEnabled: Boolean(body.pinEnabled),
      roomPin: String(body.roomPin || "").trim(),
      maxUsers: Number(body.maxUsers || 0)
    });
    return NextResponse.json({ ok: true, room });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not create room." }, { status: 400 });
  }
}
