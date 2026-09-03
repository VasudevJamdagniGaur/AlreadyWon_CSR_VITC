import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard/service";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "No company profile. Run npm run db:seed." }, { status: 404 });
    }
    const data = await getDashboardData(user.companyId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load dashboard." }, { status: 500 });
  }
}
