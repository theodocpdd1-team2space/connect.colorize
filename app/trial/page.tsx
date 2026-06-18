"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrialPage() {
  const router = useRouter();
  const [form, setForm] = useState({ vendorName: "", whatsapp: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.message || "Could not create trial.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="glass w-full max-w-xl rounded-[1.75rem] p-6">
        <p className="text-sm font-black uppercase text-cyan-200">7 Days Free Trial</p>
        <h1 className="mt-3 text-4xl font-black">Start EasyCom Web</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input className="input-field" placeholder="Vendor name" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
          <input className="input-field" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <input className="input-field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary w-full" disabled={loading} type="submit">{loading ? "Creating..." : "Create Free Trial"}</button>
          <Link className="btn-secondary w-full" href="/login">Already have account</Link>
        </form>
      </section>
    </main>
  );
}
