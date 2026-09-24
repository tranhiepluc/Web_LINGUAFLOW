import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { analyzeText } from "@/services/ai.service";
import { aiAnalyzeSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = aiAnalyzeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "VALIDATION" },
      { status: 400 },
    );
  }

  const result = await analyzeText(user.id, parsed.data.text);
  return NextResponse.json({ ok: true, data: result });
}