import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ADMIN_PREFIXES = [
  "/admin/dashboard",
  "/admin/vendors",
  "/admin/licenses",
  "/admin/rooms",
  "/admin/settings"
];

function expectedSessionValue() {
  const key = process.env.PLATFORM_ADMIN_KEY || "change-this-admin-key";
  return btoa(`admin:${key}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedAdmin = PROTECTED_ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!protectedAdmin) return NextResponse.next();

  const session = request.cookies.get("easycom_admin_session")?.value;
  if (session === expectedSessionValue()) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"]
};
