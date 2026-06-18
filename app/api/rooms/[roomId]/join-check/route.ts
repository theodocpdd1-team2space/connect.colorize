import { NextResponse } from "next/server";
import { validateRoomForJoin } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await request.json();
  const name = String(body.name || "").trim();
  const role = String(body.role || "").trim();
  if (!name || !role) {
    return NextResponse.json({ message: "Name and role are required." }, { status: 400 });
  }
  const validation = validateRoomForJoin(roomId, String(body.pin || ""));
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, room: validation.room });
}
