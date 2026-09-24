import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { searchVocabulary } from "@/services/vocabulary.service";
import type { VocabLanguage } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const language = (request.nextUrl.searchParams.get("language") ?? "all") as VocabLanguage | "all";

  if (!q.trim()) return NextResponse.json({ items: [] });

  const items = await searchVocabulary(q, { language, take: 20 });
  return NextResponse.json({ items });
}