// Stage 16: GET /professions?q= — taxonomy search for the onboarding
// profession field.

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { searchProfessions } from "@/lib/profile/taxonomy";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const professions = await searchProfessions(q);
  return NextResponse.json({ professions });
}
