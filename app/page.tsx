import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";

const whatsappText =
  "Halo%20saya%20sudah%20bayar%20EasyCom%2049rb%2C%20mohon%20dibantu%20aktivasi%20lisensinya";
const whatsappUrl = `https://wa.me/62${APP_CONFIG.adminWhatsapp.replace(/^0/, "")}?text=${whatsappText}`;

const features = [
  "QR Join",
  "Push-to-Talk",
  "Toggle Mic",
  "Ultra Low Latency Mode",
  "Clean Voice",
  "Noise Reduction",
  "Keep Screen Awake",
  "Up to 50 users per room",
  "Recommended 12 active crew",
  "Works with Xiaomi Hotspot",
  "No Discord needed"
];

export default function HomePage() {
  return (
    <main>
      <section className="page-shell grid min-h-[92vh] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-black uppercase text-cyan-200">EasyCom · Web Intercom for Event Crew</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight text-white sm:text-7xl">
            Turn your crew&apos;s phone into an event intercom.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">
            Cukup hotspot/router, HP, dan headset. Crew scan QR, tekan mic, langsung komunikasi. Cocok untuk live streaming, multicam, wedding, graduation, seminar, dan church production.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="btn-primary" href={APP_CONFIG.lynkIdCheckoutUrl}>Buy License Rp49.000</a>
            <Link className="btn-secondary" href="/trial">Start Free Trial</Link>
            <Link className="btn-secondary" href="/login">Login</Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">After payment, our admin will activate your EasyCom license manually and send your login access.</p>
          <a className="mt-3 inline-flex text-sm font-bold text-cyan-200" href={whatsappUrl}>Confirm Payment via WhatsApp</a>
        </div>

        <div className="glass relative overflow-hidden rounded-[2rem] p-5">
          <div className="absolute inset-x-6 top-8 h-20 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative rounded-[1.5rem] border border-cyan-300/25 bg-black/30 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">Ultra Low Latency</span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">QR Join</span>
            </div>
            <div className="mx-auto mt-8 flex aspect-square w-48 items-center justify-center rounded-full border border-cyan-200/40 bg-gradient-to-br from-cyan-300 to-blue-500 text-center text-slate-950 shadow-glow">
              <div>
                <p className="text-4xl font-black">MIC</p>
                <p className="text-xs font-black uppercase">Hold to Talk</p>
              </div>
            </div>
            <div className="mt-8 grid gap-2">
              {["Theo — You", "Nathan — Online", "Matthew — Speaking"].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-bold text-slate-100">
                  <span>{item}</span>
                  <span className={`h-3 w-3 rounded-full ${index === 2 ? "bg-fuchsia-400 shadow-[0_0_18px_rgba(232,121,249,0.9)]" : "bg-emerald-300"}`} />
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-cyan-100">Clean Voice</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-emerald-100">Noise Reduction</div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature} className="glass rounded-[1.5rem] p-5">
              <p className="text-lg font-black text-white">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="text-3xl font-black">Optimized for event production</h2>
          <p className="mt-3 text-slate-300">
            Optimized for ultra-low latency local communication when all crew are on the same Wi-Fi/hotspot. Actual delay depends on phone, browser, headset, and network.
          </p>
        </div>
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="text-3xl font-black">Web first, simple setup</h2>
          <p className="mt-3 text-slate-300">
            Server handles website, login, QR, room, and Socket.IO WebRTC signaling only. Audio is not stored or recorded.
          </p>
        </div>
      </section>
    </main>
  );
}
