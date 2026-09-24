import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { AiTutorChat } from "@/components/ai/ai-tutor-chat";

export const metadata: Metadata = {
  title: "Trợ lý AI · LINGUAFLOW",
};

export const dynamic = "force-dynamic";

export default function AiTutorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trợ lý AI</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hỏi bất cứ điều gì về từ vựng, ngữ pháp và cách dùng tự nhiên.
          </p>
        </div>
      </div>

      <AiTutorChat />
    </div>
  );
}