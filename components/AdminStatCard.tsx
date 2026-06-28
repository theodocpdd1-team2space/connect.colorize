type AdminStatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function AdminStatCard({ label, value, helper }: AdminStatCardProps) {
  return (
    <div className="glass rounded-[1.25rem] p-4">
      <p className="text-xs font-black uppercase text-cyan-200/80">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}
