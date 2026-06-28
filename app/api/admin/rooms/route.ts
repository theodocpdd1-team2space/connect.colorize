import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { endRoom, getRooms, resetRoom } from "@/lib/adminRooms";
import { endRuntimeRoom, resetRuntimeRoom } from "@/lib/adminRoomRuntime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  return NextResponse.json({
    rooms: getRooms({
      status: url.searchParams.get("status") || "all",
      vendorId: url.searchParams.get("vendorId") || "",
      date: url.searchParams.get("date") || ""
    })
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.action === "end" && !endRuntimeRoom(String(body.roomId))) endRoom(String(body.roomId));
  if (body.action === "reset" && !resetRuntimeRoom(String(body.roomId))) resetRoom(String(body.roomId));
  return NextResponse.json({ ok: true });
}
