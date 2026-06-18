"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="text-xl font-black text-white">
          Solusivendor EasyCom
        </Link>
        <nav className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/create-room">
            Create Room
          </Link>
          <Link className="btn-secondary" href="/pricing">
            Pricing
          </Link>
          <button className="btn-secondary" type="button" onClick={logout}>Logout</button>
        </nav>
      </div>
      {children}
    </main>
  );
}
