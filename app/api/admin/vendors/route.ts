import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { createVendor, getVendors } from "@/lib/adminVendors";
import { createLicense } from "@/lib/adminLicenses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  return NextResponse.json({
    vendors: getVendors({
      search: url.searchParams.get("search") || "",
      status: url.searchParams.get("status") || "all"
    })
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const vendor = await createVendor({
    vendorName: String(body.vendorName || "").trim(),
    email: String(body.email || "").trim(),
    whatsapp: String(body.whatsapp || "").trim(),
    password: String(body.password || "12345678")
  });
  let license = null;
  if (body.autoCreateLicense) {
    license = createLicense({
      vendorId: vendor.id,
      plan: body.plan || "trial",
      maxUsers: body.maxUsers,
      recommendedUsers: body.recommendedUsers,
      maxActiveRooms: body.maxActiveRooms,
      lifetimeUse: body.lifetimeUse,
      updateUntil: body.updateUntil,
      trialDays: body.trialDays,
      status: body.status || "active"
    });
  }
  return NextResponse.json({ ok: true, vendor, license });
}
