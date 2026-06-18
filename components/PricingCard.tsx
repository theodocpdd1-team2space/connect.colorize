import Link from "next/link";

type PricingCardProps = {
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href?: string;
  muted?: boolean;
};

export default function PricingCard({ title, price, description, features, cta, href, muted }: PricingCardProps) {
  const content = (
    <>
      <p className="text-sm font-bold uppercase text-cyan-200">{title}</p>
      <p className="mt-3 text-3xl font-black text-white">{price}</p>
      <p className="mt-2 min-h-12 text-sm text-slate-300">{description}</p>
      <ul className="mt-5 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
            {feature}
          </li>
        ))}
      </ul>
      <span className={`mt-5 inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-black ${muted ? "bg-white/10 text-slate-200" : "bg-cyan-300 text-slate-950"}`}>
        {cta}
      </span>
    </>
  );

  return href ? (
    <Link href={href} className="glass block rounded-[1.5rem] p-5 transition hover:border-cyan-300/45">
      {content}
    </Link>
  ) : (
    <div className="glass rounded-[1.5rem] p-5">{content}</div>
  );
}
