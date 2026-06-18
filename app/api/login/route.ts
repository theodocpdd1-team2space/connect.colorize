import { NextResponse } from "next/server";
import { SESSION_COOKIE, authenticateVendor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const vendor = await authenticateVendor(String(body.login || ""), String(body.password || ""));
  if (!vendor) {
    return NextResponse.json({ message: "Invalid login or password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, vendor });
  response.cookies.set(SESSION_COOKIE, vendor.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
