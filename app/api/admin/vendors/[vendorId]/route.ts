import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  getVendorById,
  getVendorLicenses,
  getVendorRooms,
  resetVendorPassword,
  setAllVendorLicensesStatus,
  updateVendor
} from "@/lib/adminVendors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { vendorId } = await params;
  const vendor = getVendorById(vendorId);
  if (!vendor) return NextResponse.json({ message: "Vendor not found." }, { status: 404 });
  return NextResponse.json({ vendor, licenses: getVendorLicenses(vendorId), rooms: getVendorRooms(vendorId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { vendorId } = await params;
  const body = await request.json();
  if (body.action === "reset-password") {
    if (!body.password || body.password !== body.confirmPassword) {
      return NextResponse.json({ message: "Password confirmation does not match." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, vendor: await resetVendorPassword(vendorId, String(body.password)) });
  }
  if (body.action === "suspend-all") {
    setAllVendorLicensesStatus(vendorId, "suspended");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "activate-all") {
    setAllVendorLicensesStatus(vendorId, "active");
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({
    ok: true,
    vendor: updateVendor(vendorId, {
      vendorName: String(body.vendorName || "").trim(),
      email: String(body.email || "").trim(),
      whatsapp: String(body.whatsapp || "").trim()
    })
  });
}
