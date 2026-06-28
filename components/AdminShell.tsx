"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  ["Dashboard", "/admin/dashboard"],
  ["Vendors", "/admin/vendors"],
  ["Licenses", "/admin/licenses"],
  ["Rooms", "/admin/rooms"],
  ["Settings", "/admin/settings"],
  ["Open Website", "/"]
];

export default function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[240px_1fr]">
        <aside className="glass rounded-[1.5rem] p-4 lg:sticky lg:top-5 lg:h-[calc(100vh-40px)]">
          <Link href="/admin/dashboard" className="block text-xl font-black text-white">EasyCom Admin</Link>
          <p className="mt-1 text-xs font-bold uppercase text-cyan-200">Platform Panel</p>
          <nav className="mt-6 grid gap-2">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  pathname === href ? "bg-cyan-300 text-slate-950" : "text-slate-200 hover:bg-white/8"
                }`}
              >
                {label}
              </Link>
            ))}
            <button className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-100 hover:bg-red-300/10" type="button" onClick={logout}>
              Logout
            </button>
          </nav>
        </aside>
        <section>
          <div className="mb-5">
            <p className="text-sm font-black uppercase text-cyan-200">Admin</p>
            <h1 className="mt-1 text-4xl font-black text-white">{title}</h1>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
