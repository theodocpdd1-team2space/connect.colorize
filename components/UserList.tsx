export type RoomUser = {
  id: string;
  name: string;
  speaking?: boolean;
};

type UserListProps = {
  users: RoomUser[];
  selfId?: string;
};

export default function UserList({ users, selfId }: UserListProps) {
  return (
    <div className="space-y-2">
      {users.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No crew online yet.</div>
      ) : (
        users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-white">{user.name}</p>
                {user.id === selfId ? (
                  <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[0.7rem] font-bold text-cyan-100">You</span>
                ) : null}
                {user.speaking ? (
                  <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-100">Speaking</span>
                ) : user.id !== selfId ? (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem] font-bold text-slate-300">Online</span>
                ) : null}
              </div>
            </div>
            <span
              className={`h-3 w-3 rounded-full ${user.speaking ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" : "bg-slate-500"}`}
              aria-label={user.speaking ? "Speaking" : "Muted"}
            />
          </div>
        ))
      )}
    </div>
  );
}
