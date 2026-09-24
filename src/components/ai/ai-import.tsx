"use client";

import { useEffect, useState } from "react";
import { CheckSquare, FileText, Loader2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { toVietnameseMessage } from "@/lib/errors";
import { bulkSaveVocabularyAction } from "@/lib/actions";
import type { AnalyzedWord } from "@/types";

interface AnalyzeResult {
  language: "english" | "chinese" | "vietnamese";
  words: AnalyzedWord[];
  totalTokens: number;
  knownCount: number;
  unknownFromDict: number;
  stopwordCount: number;
}

const placeholder = `Paste một bài báo, đoạn chat hoặc văn bản bạn muốn học từ vựng. Ví dụ:

Learning a new language is a journey, not a race. Every day you show up, you build momentum. Start small, stay curious, and celebrate every tiny win along the way.`;

export function AiImport() {
  const params = useSearchParams();
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hint = params.get("hint");
    if (hint) setText(hint);
  }, [params]);

  const analyze = async () => {
    if (text.trim().length < 3) return toast.error("Vui lòng nhập đoạn văn ít nhất 3 ký tự.");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI_ERROR");
      setResult(json.data as AnalyzeResult);
      setSelected(new Set(json.data.words.filter((w: AnalyzedWord) => w.vocabularyId).map((w: AnalyzedWord) => w.vocabularyId!)));
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const saveAll = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setSaving(true);
    try {
      const res = await bulkSaveVocabularyAction(ids);
      toast.success(`Đã thêm ${res.created} từ mới vào thư viện`);
      setResult(null);
      setText("");
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const langLabel =
    result?.language === "chinese" ? "🇨🇳 Tiếng Trung" : result?.language === "vietnamese" ? "🇻🇳 Tiếng Việt" : "🇬🇧 Tiếng Anh";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-h-[220px] text-base leading-relaxed"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{text.length} ký tự</p>
          <Button type="button" onClick={analyze} disabled={loading || text.trim().length < 3} className="gap-1.5">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Đang phân tích..." : "Phân tích bằng AI"}
          </Button>
        </div>
      </div>

      {result && result.words.length === 0 && (
        <EmptyState
          icon="error"
          title="Không phát hiện từ vựng"
          description="Đoạn văn có vẻ là tiếng Việt hoặc không đủ nội dung. Hãy dán văn bản tiếng Anh/Trung."
        />
      )}

      {result && result.words.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-secondary px-3 py-1.5">{langLabel}</span>
            <span className="rounded-full bg-secondary px-3 py-1.5">📊 {result.totalTokens} token</span>
            <span className="rounded-full bg-secondary px-3 py-1.5">✅ {result.knownCount} từ đã biết</span>
            <span className="rounded-full bg-secondary px-3 py-1.5">💡 {result.unknownFromDict} từ chưa có từ điển</span>
          </div>

          <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
            {result.words.map((w, i) => (
              <li key={i} className="flex items-start gap-3 p-3.5">
                <input
                  type="checkbox"
                  checked={selected.has(w.vocabularyId ?? "")}
                  disabled={!w.vocabularyId}
                  onChange={() => w.vocabularyId && toggle(w.vocabularyId)}
                  className="mt-1.5 size-4 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{w.word}</span>
                    {w.pinyin && <span className="text-xs text-muted-foreground">{w.pinyin}</span>}
                    {w.partOfSpeech && <span className="text-[11px] text-muted-foreground">{w.partOfSpeech}</span>}
                    {w.vocabularyId ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600">trong từ điển</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">chưa có</span>
                    )}
                  </div>
                  {w.meaningVi && <p className="mt-0.5 text-sm text-muted-foreground">{w.meaningVi}</p>}
                </div>
                {w.vocabularyId && (
                  <span className="flex items-center text-[11px] text-muted-foreground">
                    {selected.has(w.vocabularyId) ? <CheckSquare className="size-4 text-emerald-500" /> : null}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <Button type="button" onClick={saveAll} disabled={saving || !selected.size} size="lg" className="w-full gap-1.5">
            <FileText />
            {saving ? "Đang lưu..." : `Lưu ${selected.size} từ vào thư viện`}
          </Button>
        </div>
      )}
    </div>
  );
}