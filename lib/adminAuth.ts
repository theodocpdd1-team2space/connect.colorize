import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { APP_CONFIG } from "./config";

export const ADMIN_SESSION_COOKIE = "easycom_admin_session";

function expectedSessionValue() {
  return btoa(`admin:${APP_CONFIG.platformAdminKey}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value === expectedSessionValue();
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, expectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export function validateAdminKey(adminKey: string) {
  return adminKey === APP_CONFIG.platformAdminKey;
}
