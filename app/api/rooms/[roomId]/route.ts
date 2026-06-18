import { NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/auth";
import { getJoinUrl } from "@/lib/config";
import { endRoom, getRoomById } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const room = getRoomById(roomId);
  if (!room) return NextResponse.json({ message: "Room not found." }, { status: 404 });
  return NextResponse.json({ room, joinUrl: getJoinUrl(room.id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const vendor = await getCurrentVendor();
  if (!vendor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { roomId } = await params;
  const body = await request.json();
  const room = getRoomById(roomId);
  if (!room || room.vendor_id !== vendor.id) return NextResponse.json({ message: "Room not found." }, { status: 404 });
  if (body.action === "end") {
    return NextResponse.json({ ok: true, room: endRoom(roomId) });
  }
  return NextResponse.json({ message: "Unknown action." }, { status: 400 });
}
