import Link from "next/link";
import PricingCard from "@/components/PricingCard";

const plans = [
  {
    title: "Free Trial",
    price: "Free",
    description: "7 days to test EasyCom Web Mode.",
    features: ["7 days", "max 2 users", "1 active room", "QR join", "Push-to-talk", "Toggle mic", "Web Mode only"],
    cta: "Start Free Trial",
    href: "/trial"
  },
  {
    title: "EasyCom Web License",
    price: "Rp249.000 / vendor",
    description: "Lifetime use, update 1 year.",
    features: [
      "1 active room/session",
      "up to 50 connected users",
      "recommended 12 active crew",
      "requires internet",
      "works with router or Xiaomi hotspot",
      "QR join",
      "Push-to-talk",
      "Toggle mic",
      "web-based"
    ],
    cta: "Buy / Contact Admin"
  },
  {
    title: "Additional Room License",
    price: "Rp249.000 / license",
    description: "Adds 1 additional simultaneous active room.",
    features: ["for additional simultaneous active room", "1 license = 1 active room/session"],
    cta: "Add License"
  },
  {
    title: "Machine Hub",
    price: "Coming soon",
    description: "Future offline event mode.",
    features: ["offline event mode", "no internet during event"],
    cta: "Notify Me / Coming Soon",
    muted: true
  }
];

export default function PricingPage() {
  return (
    <main className="page-shell">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-cyan-200">Pricing</p>
          <h1 className="mt-2 text-4xl font-black">Simple room-based license.</h1>
        </div>
        <Link className="btn-secondary" href="/">
          Home
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => (
          <PricingCard key={plan.title} {...plan} />
        ))}
      </div>
      <section className="glass mt-6 overflow-x-auto rounded-[1.5rem] p-5">
        <h2 className="text-2xl font-black">Comparison</h2>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="text-cyan-100">
            <tr>
              <th className="p-3">Plan</th>
              <th className="p-3">Users</th>
              <th className="p-3">Active Room</th>
              <th className="p-3">Internet</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            <tr className="border-t border-white/10"><td className="p-3">Trial</td><td className="p-3">2</td><td className="p-3">1</td><td className="p-3">Required</td><td className="p-3">Available</td></tr>
            <tr className="border-t border-white/10"><td className="p-3">Web License</td><td className="p-3">50 connected, recommended 12 active</td><td className="p-3">1</td><td className="p-3">Required</td><td className="p-3">Available</td></tr>
            <tr className="border-t border-white/10"><td className="p-3">Additional Room</td><td className="p-3">Uses vendor entitlement</td><td className="p-3">+1</td><td className="p-3">Required</td><td className="p-3">Manual license</td></tr>
            <tr className="border-t border-white/10"><td className="p-3">Machine Hub</td><td className="p-3">TBA</td><td className="p-3">TBA</td><td className="p-3">No internet during event</td><td className="p-3">Coming soon</td></tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
