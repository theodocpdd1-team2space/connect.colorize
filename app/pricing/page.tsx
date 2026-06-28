import Link from "next/link";
import PricingCard from "@/components/PricingCard";
import { APP_CONFIG } from "@/lib/config";

const whatsappText =
  "Halo%20saya%20sudah%20bayar%20EasyCom%2049rb%2C%20mohon%20dibantu%20aktivasi%20lisensinya";
const whatsappUrl = `https://wa.me/62${APP_CONFIG.adminWhatsapp.replace(/^0/, "")}?text=${whatsappText}`;

export default function PricingPage() {
  return (
    <main className="page-shell">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-cyan-200">Pricing</p>
          <h1 className="mt-2 text-4xl font-black">All EasyCom Web features for Rp49.000.</h1>
        </div>
        <Link className="btn-secondary" href="/">Home</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <PricingCard
          title="Free Trial"
          price="Rp0"
          description="7 days for testing only."
          features={["2 users", "1 active room", "QR join", "Push-to-talk", "Toggle mic"]}
          cta="Start Free Trial"
          href="/trial"
        />
        <PricingCard
          title="EasyCom Web License"
          price="Rp49.000"
          description="Sekali bayar. All features included."
          features={[
            "Banyak room",
            "Max 50 users per room",
            "Recommended 12 active crew per room",
            "QR Join",
            "Push-to-Talk + Toggle Mic",
            "Ultra Low Latency + Clean Voice",
            "Noise Reduction",
            "Keep Screen Awake"
          ]}
          cta="Buy via Lynk.id"
          href={APP_CONFIG.lynkIdCheckoutUrl}
        />
        <PricingCard
          title="Machine Hub"
          price="Coming Soon"
          description="Offline mode tanpa internet."
          features={["Dedicated offline mode", "For future production setup"]}
          cta="Coming Soon"
          muted
        />
        <PricingCard
          title="Room Recording"
          price="Coming Soon"
          description="Pro add-on for future review."
          features={["Save communication history", "Not available in this MVP"]}
          cta="Coming Soon"
          muted
        />
      </div>

      <section className="glass mt-6 rounded-[1.5rem] p-5">
        <h2 className="text-2xl font-black">Manual activation</h2>
        <p className="mt-2 text-slate-300">After payment, our admin will activate your EasyCom license manually and send your login access.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn-primary" href={APP_CONFIG.lynkIdCheckoutUrl}>Buy License - Rp49.000</a>
          <a className="btn-secondary" href={whatsappUrl}>Confirm Payment via WhatsApp</a>
        </div>
      </section>

      <section className="glass mt-6 overflow-x-auto rounded-[1.5rem] p-5">
        <h2 className="text-2xl font-black">Comparison</h2>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <thead className="text-cyan-100"><tr><th className="p-3">Plan</th><th className="p-3">Price</th><th className="p-3">Users</th><th className="p-3">Rooms</th><th className="p-3">Features</th></tr></thead>
          <tbody className="text-slate-200">
            <tr className="border-t border-white/10"><td className="p-3">Free Trial</td><td className="p-3">Rp0</td><td className="p-3">2</td><td className="p-3">1</td><td className="p-3">Testing only</td></tr>
            <tr className="border-t border-white/10"><td className="p-3">Web License</td><td className="p-3">Rp49.000</td><td className="p-3">50 per room, recommended 12 active</td><td className="p-3">Banyak room</td><td className="p-3">All current EasyCom Web features</td></tr>
            <tr className="border-t border-white/10"><td className="p-3">Machine Hub</td><td className="p-3">Coming Soon</td><td className="p-3">TBA</td><td className="p-3">TBA</td><td className="p-3">Offline mode</td></tr>
            <tr className="border-t border-white/10"><td className="p-3">Room Recording</td><td className="p-3">Coming Soon</td><td className="p-3">TBA</td><td className="p-3">TBA</td><td className="p-3">Future add-on</td></tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
