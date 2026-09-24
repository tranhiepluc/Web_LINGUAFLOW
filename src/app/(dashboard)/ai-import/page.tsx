import type { Metadata } from "next";
import { FileText, Sparkles } from "lucide-react";
import { AiImport } from "@/components/ai/ai-import";

export const metadata: Metadata = {
  title: "AI Import · LINGUAFLOW",
};

export const dynamic = "force-dynamic";

export default function AiImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </span>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <FileText className="size-7 text-primary" /> Phân tích văn bản
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Dán bài báo, đoạn hội thoại... AI trích xuất từ vựng, so với từ điển và giúp bạn lưu vào thư viện.
          </p>
        </div>
      </div>

      <AiImport />
    </div>
  );
}