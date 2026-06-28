import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { createLicense, getLicenses, getUniqueLicenseKey } from "@/lib/adminLicenses";
import { createVendor } from "@/lib/adminVendors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  return NextResponse.json({
    suggestedKey: getUniqueLicenseKey(),
    licenses: getLicenses({
      plan: url.searchParams.get("plan") || "all",
      status: url.searchParams.get("status") || "all",
      lifetime: url.searchParams.get("lifetime") || "all"
    })
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  let vendorId = body.vendorId;
  if (!vendorId && body.createVendor) {
    const vendor = await createVendor({
      vendorName: String(body.vendorName || "").trim(),
      email: String(body.email || "").trim(),
      whatsapp: String(body.whatsapp || "").trim(),
      password: String(body.password || "12345678")
    });
    vendorId = vendor.id;
  }
  if (!vendorId) return NextResponse.json({ message: "Vendor is required." }, { status: 400 });
  const license = createLicense({ ...body, vendorId });
  return NextResponse.json({ ok: true, license });
}
