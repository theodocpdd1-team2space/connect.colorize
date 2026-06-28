import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  activateLicense,
  deleteLicenseIfSafe,
  extendLicenseOneYear,
  getLicenseById,
  resetLicenseActiveRooms,
  suspendLicense,
  updateLicense
} from "@/lib/adminLicenses";
import { getRooms } from "@/lib/adminRooms";
import { endRuntimeRoom } from "@/lib/adminRoomRuntime";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ licenseId: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { licenseId } = await params;
  const license = getLicenseById(licenseId);
  if (!license) return NextResponse.json({ message: "License not found." }, { status: 404 });
  return NextResponse.json({ license });
}

export async function POST(request: Request, { params }: { params: Promise<{ licenseId: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { licenseId } = await params;
  const body = await request.json();
  if (body.action === "suspend") suspendLicense(licenseId);
  else if (body.action === "activate") activateLicense(licenseId);
  else if (body.action === "extend-year") extendLicenseOneYear(licenseId);
  else if (body.action === "reset-rooms") {
    const activeRooms = getRooms({ status: "active" }).filter((room: any) => room.license_id === licenseId);
    activeRooms.forEach((room: any) => endRuntimeRoom(room.id));
    resetLicenseActiveRooms(licenseId);
  }
  else if (body.action === "delete") deleteLicenseIfSafe(licenseId);
  else return NextResponse.json({ ok: true, license: updateLicense(licenseId, body) });
  return NextResponse.json({ ok: true, license: getLicenseById(licenseId) });
}
