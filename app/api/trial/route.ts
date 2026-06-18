import { NextResponse } from "next/server";
import { SESSION_COOKIE, hashPassword } from "@/lib/auth";
import { createVendor, getVendorByLogin } from "@/lib/db";
import { createTrialLicense } from "@/lib/license";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const vendorName = String(body.vendorName || "").trim();
  const whatsapp = String(body.whatsapp || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!vendorName || !whatsapp || !email || password.length < 6) {
    return NextResponse.json({ message: "Vendor name, WhatsApp, email, and password minimum 6 characters are required." }, { status: 400 });
  }

  if (getVendorByLogin(email) || getVendorByLogin(whatsapp)) {
    return NextResponse.json({ message: "Email or WhatsApp already registered." }, { status: 409 });
  }

  const vendor = createVendor({
    vendorName,
    whatsapp,
    email,
    passwordHash: await hashPassword(password)
  });
  const license = createTrialLicense(vendor.id);
  const response = NextResponse.json({ ok: true, vendor, license });
  response.cookies.set(SESSION_COOKIE, vendor.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
