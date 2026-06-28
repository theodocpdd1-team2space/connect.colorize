"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminKey })
    });
    if (!response.ok) {
      setError("Invalid admin key.");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="glass w-full max-w-md rounded-[1.75rem] p-6">
        <p className="text-sm font-black uppercase text-cyan-200">Platform Admin</p>
        <h1 className="mt-3 text-4xl font-black">Admin Login</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input className="input-field" placeholder="Admin Key" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} />
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary w-full" type="submit">Login</button>
          <Link className="btn-secondary w-full" href="/">Open Website</Link>
        </form>
      </section>
    </main>
  );
}
