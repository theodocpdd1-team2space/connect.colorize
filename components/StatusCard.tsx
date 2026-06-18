type StatusCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function StatusCard({ label, value, helper }: StatusCardProps) {
  return (
    <div className="glass rounded-[1.25rem] p-4">
      <p className="text-xs font-bold uppercase text-cyan-200/80">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-300">{helper}</p> : null}
    </div>
  );
}
