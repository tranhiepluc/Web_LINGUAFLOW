import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { saveVocabulary } from "@/services/vocabulary.service";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({ vocabularyId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION" }, { status: 400 });

  const result = await saveVocabulary(user.id, parsed.data.vocabularyId);
  return NextResponse.json({ ok: true, created: result.created });
}