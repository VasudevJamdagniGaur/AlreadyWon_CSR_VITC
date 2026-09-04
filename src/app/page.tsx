import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-white">
      <main className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold uppercase tracking-[0.18em] sm:text-7xl md:text-8xl">
          <span className="bg-gradient-to-b from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(74,222,224,0.35)]">
            KELLYOS
          </span>
        </h1>

        <div className="relative mt-8 h-px w-64 sm:w-80" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
          <div className="absolute left-1/2 top-1/2 h-2 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80 blur-[6px]" />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card/80 shadow-[0_0_18px_6px_rgba(74,222,224,0.85)]" />
        </div>

        <p className="mt-8 max-w-xl text-base font-normal tracking-wide text-cyan-100/70 sm:text-lg">
          CSR decision intelligence, without the complexity.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-10 min-w-[108px] items-center justify-center rounded-md border border-cyan-300/60 bg-transparent px-6 text-sm font-medium text-white transition hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=register"
            className="inline-flex h-10 min-w-[108px] items-center justify-center rounded-md bg-cyan-300 px-6 text-sm font-medium text-[#050d10] transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Register
          </Link>
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center text-xs text-cyan-100/45">
        © 2026 KellyOS
      </footer>
    </div>
  );
}
