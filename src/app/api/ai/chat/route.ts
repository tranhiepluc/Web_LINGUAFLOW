import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { aiChat } from "@/services/ai.service";
import { aiChatSchema } from "@/lib/validations";
import { toVietnameseMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = aiChatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "VALIDATION" },
      { status: 400 },
    );
  }

  try {
    const result = await aiChat(user.id, parsed.data.message, parsed.data.conversationId);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = toVietnameseMessage(error);
    const status = message === "Giới hạn tần suất, hãy thử lại sau." || message.includes("tần suất") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}