import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xl font-semibold tracking-tight">KELLYOS</p>
          <p className="text-[10px] uppercase tracking-widest text-navy-300">
            AI CSR Intelligence
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-white text-navy-950 hover:bg-navy-100">
            <Link href="/login">Enter</Link>
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-700/40 via-transparent to-transparent" />
        <BadgeLine />
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          KellyOS
        </h1>
        <p className="mt-3 text-lg text-navy-200 md:text-xl">
          AI-Powered CSR Decision & Project Intelligence
        </p>
        <p className="mt-4 max-w-2xl text-base text-navy-300">
          Prioritize the right projects. Match the right partners. Monitor the outcomes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-navy-950 hover:bg-navy-100">
            <Link href="/login">
              Enter <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="#architecture">View Architecture</Link>
          </Button>
        </div>
      </section>

      <section id="architecture" className="border-t border-white/10 bg-navy-950/60 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-navy-300" />
          <h2 className="text-2xl font-semibold">Run the KellyOS Demo</h2>
          <p className="mx-auto mt-2 max-w-xl text-navy-300">
            Decision-support for CSR portfolios — not an autonomous funding engine. Final decisions remain with humans.
          </p>
          <Button asChild size="lg" className="mt-6 bg-white text-navy-950 hover:bg-navy-100">
            <Link href="/login">
              Enter <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-8 text-xs text-navy-400">
            Demo environment — data shown is synthetic.
          </p>
        </div>
      </section>
    </div>
  );
}

function BadgeLine() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-navy-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Decision-support platform · Demo Mode available
    </span>
  );
}
