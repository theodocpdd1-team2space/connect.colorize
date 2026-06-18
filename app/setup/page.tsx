import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="page-shell">
      <section className="glass rounded-[1.75rem] p-6">
        <p className="text-sm font-black uppercase text-cyan-200">Future Offline Mode</p>
        <h1 className="mt-3 text-4xl font-black">Machine Hub is coming soon.</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          EasyCom Web Mode is the current MVP for VPS/domain deployment. Machine Hub offline mode will return later as a dedicated future product.
        </p>
        <Link className="btn-primary mt-6" href="/">
          Back to EasyCom Web
        </Link>
      </section>
    </main>
  );
}
