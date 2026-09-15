// Stage 16: GET /skills?profession=:id — suggested skills for a profession
// (or the general list when no profession is given).

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { suggestedSkills } from "@/lib/profile/taxonomy";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const professionId = request.nextUrl.searchParams.get("profession");
  const skills = await suggestedSkills(professionId);
  return NextResponse.json({ skills });
}
