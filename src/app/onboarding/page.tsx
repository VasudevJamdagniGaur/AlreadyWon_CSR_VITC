import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Scale, Wallet, Activity } from "lucide-react";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user?.companyId) {
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (company) {
      // Already onboarded — show quick start instead of blocking
    }
  }

  const company = await prisma.company.findFirst();
  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>KellyOS setup required</CardTitle>
            <CardDescription>
              No company profile found. Run npm run db:seed to load Northstar Industries data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <code className="block rounded bg-muted p-3 text-xs">npm run db:seed</code>
            <Button asChild>
              <Link href="/login">Return to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-cyan-50 text-glow-cyan">Welcome to KellyOS</h1>
        <p className="mt-2 text-cyan-200/80">
          Decision intelligence for your CSR portfolio. Company profile loaded:{" "}
          <strong className="text-white">{company.name}</strong>.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            { step: "1", title: "Prioritize projects", href: "/prioritization", icon: Scale },
            { step: "2", title: "Choose funding", href: "/allocation", icon: Wallet },
            { step: "3", title: "Monitor execution", href: "/monitoring", icon: Activity },
            { step: "4", title: "Review company", href: "/settings", icon: Building2 },
          ].map((s) => (
            <Link
              key={s.step}
              href={s.href}
              className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 transition hover:bg-cyan-400/10"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold">
                {s.step}
              </span>
              <div className="flex-1">
                <p className="font-medium">{s.title}</p>
              </div>
              <s.icon className="h-4 w-4 text-cyan-200/80" />
            </Link>
          ))}
        </div>

        <Button asChild size="lg" className="mt-8 bg-cyan-300 text-[#050d10] hover:bg-cyan-200">
          <Link href="/dashboard">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
