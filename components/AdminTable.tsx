type AdminTableProps = {
  headers: string[];
  children: React.ReactNode;
};

export default function AdminTable({ headers, children }: AdminTableProps) {
  return (
    <div className="glass overflow-x-auto rounded-[1.5rem] p-4">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase text-cyan-100">
          <tr>
            {headers.map((header) => (
              <th key={header} className="p-3 font-black">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
