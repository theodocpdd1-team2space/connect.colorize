"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.message || "Login failed.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="glass w-full max-w-md rounded-[1.75rem] p-6">
        <p className="text-sm font-black uppercase text-cyan-200">Vendor Login</p>
        <h1 className="mt-3 text-4xl font-black">Login</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input className="input-field" placeholder="Email / WhatsApp" value={login} onChange={(e) => setLogin(e.target.value)} />
          <input className="input-field" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary w-full" type="submit">Login</button>
          <Link className="btn-secondary w-full" href="/trial">Start Free Trial</Link>
        </form>
      </section>
    </main>
  );
}
