import Link from "next/link";
import PricingCard from "@/components/PricingCard";

export default function HomePage() {
  return (
    <main>
      <section className="page-shell grid min-h-[92vh] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-black uppercase text-cyan-200">Solusivendor EasyCom</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight text-white sm:text-7xl">
            Turn your crew&apos;s phone into an event intercom.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">
            Use router or Xiaomi hotspot, phone, and wired headset. No Discord. No complicated setup.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/trial">
              Start Free Trial
            </Link>
            <Link className="btn-secondary" href="/login">
              Login
            </Link>
            <Link className="btn-secondary" href="/pricing">
              See Pricing
            </Link>
          </div>
        </div>
        <div className="glass rounded-[1.75rem] p-5">
          <div className="rounded-[1.35rem] border border-cyan-300/25 bg-cyan-300/10 p-5">
            <p className="text-sm font-black uppercase text-cyan-100">Web Mode MVP</p>
            <div className="mt-5 grid gap-3">
              {[
                "Router or Xiaomi hotspot + phone + headset.",
                "Web Mode requires internet for room and signaling.",
                "Audio is designed for peer-to-peer connection when all crew are on the same Wi-Fi/hotspot.",
                "Use wired headset for best result.",
                "Up to 50 connected users, recommended 12 active crew."
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-4 md:grid-cols-3">
        {[
          ["Create Room", "Vendor login dashboard, create event room, display QR join link."],
          ["Crew Join", "Crew scan QR, enter name and role, allow microphone."],
          ["Talk", "Push-to-Talk or Toggle Mic using WebRTC audio-only."]
        ].map(([title, body]) => (
          <div key={title} className="glass rounded-[1.5rem] p-5">
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-2 text-slate-300">{body}</p>
          </div>
        ))}
      </section>

      <section className="page-shell grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="text-3xl font-black">Xiaomi Hotspot Setup</h2>
          <p className="mt-3 text-slate-300">
            Xiaomi hotspot provides both internet and a local Wi-Fi network. For best local audio path, keep all crew on the same hotspot/router.
          </p>
        </div>
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="text-3xl font-black">FAQ</h2>
          <p className="mt-3 text-slate-300">
            Server handles website, login, QR, room, and Socket.IO WebRTC signaling only. Server does not process, store, record, or relay audio for MVP.
          </p>
        </div>
      </section>

      <section className="page-shell">
        <h2 className="mb-4 text-3xl font-black">Pricing Preview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <PricingCard title="Free Trial" price="Free" description="7 days for small testing." features={["Max 2 users", "1 active room", "QR join", "Push-to-talk", "Toggle mic"]} cta="Start Free Trial" href="/trial" />
          <PricingCard title="EasyCom Web License" price="Rp249.000" description="Lifetime use with 1 year update." features={["1 active room/session", "Up to 50 connected users", "Recommended 12 active crew"]} cta="Buy / Contact Admin" href="/pricing" />
          <PricingCard title="Machine Hub" price="Coming soon" description="Future offline event mode." features={["Offline mode", "No internet during event", "Dedicated Machine Hub"]} cta="Coming Soon" muted />
        </div>
      </section>
    </main>
  );
}
