import { NextResponse } from "next/server";
import { setAdminSession, validateAdminKey } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = await request.json();
  if (!validateAdminKey(String(body.adminKey || ""))) {
    return NextResponse.json({ message: "Invalid admin key." }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
