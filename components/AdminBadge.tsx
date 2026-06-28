type AdminBadgeProps = {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate";
};

const styles = {
  green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  red: "border-red-300/30 bg-red-300/10 text-red-100",
  blue: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  slate: "border-slate-300/20 bg-white/5 text-slate-200"
};

export default function AdminBadge({ children, tone = "slate" }: AdminBadgeProps) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${styles[tone]}`}>{children}</span>;
}
