type ConnectionBadgeProps = {
  status: "Connecting" | "Connected" | "Reconnecting" | "Mic Blocked" | "Disconnected" | "Speaking" | "Muted";
};

const styles: Record<ConnectionBadgeProps["status"], string> = {
  Connecting: "border-amber-300/35 bg-amber-300/12 text-amber-100",
  Connected: "border-cyan-300/35 bg-cyan-300/12 text-cyan-100",
  Reconnecting: "border-blue-300/35 bg-blue-300/12 text-blue-100",
  "Mic Blocked": "border-red-300/35 bg-red-300/12 text-red-100",
  Disconnected: "border-slate-300/25 bg-slate-300/10 text-slate-200",
  Speaking: "border-emerald-300/35 bg-emerald-300/12 text-emerald-100",
  Muted: "border-slate-300/25 bg-slate-300/10 text-slate-200"
};

export default function ConnectionBadge({ status }: ConnectionBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}
