"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioButton } from "@/components/shared/audio-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { searchVocabularyAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { useDebounce } from "@/hooks/use-debounce";
import type { VocabLanguage } from "@/types";

interface SearchRow {
  id: string;
  word: string;
  meaningVi: string;
  language: VocabLanguage;
  pinyin: string | null;
  pronunciation: string | null;
  partOfSpeech: string | null;
}

const TABS: { value: "all" | VocabLanguage; label: string }[] = [
  { value: "all", label: "🌎 Tất cả" },
  { value: "english", label: "🇬🇧 Anh" },
  { value: "chinese", label: "🇨🇳 Trung" },
];

export function DictionarySearch({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [tab, setTab] = useState<"all" | VocabLanguage>("all");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounced = useDebounce(query, 250);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (debounced) runSearch(debounced, tab);
      return;
    }
    if (debounced.length >= 2) {
      runSearch(debounced, tab);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [debounced, tab]);

  const runSearch = async (q: string, lang: "all" | VocabLanguage) => {
    setLoading(true);
    try {
      const rows = await searchVocabularyAction(q, lang);
      setResults(rows as unknown as SearchRow[]);
      setSearched(true);
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập từ tiếng Anh, chữ Hán, pinyin hoặc nghĩa tiếng Việt..."
          className="h-14 rounded-2xl pl-12 text-base sm:text-lg"
          autoFocus
        />
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        {loading && (
          <span className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value);
              if (debounced.length >= 2) runSearch(debounced, t.value);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              tab === t.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((r) => (
            <div
              key={r.id}
              className="card-hover rounded-3xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{r.language === "english" ? "🇬🇧" : "🇨🇳"}</span>
                    <Link href={`/dictionary/${r.id}`} className="truncate text-lg font-bold hover:text-primary">
                      {r.word}
                    </Link>
                    {r.partOfSpeech && (
                      <Badge variant="secondary" className="text-[10px]">
                        {r.partOfSpeech}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {r.language === "english" ? r.pronunciation : r.pinyin}
                  </p>
                </div>
                <AudioButton text={r.word} language={r.language} size="icon-sm" variant="ghost" />
              </div>
              <p className="mt-2 text-sm">{r.meaningVi}</p>
              <Link href={`/dictionary/${r.id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                Xem chi tiết →
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon="search"
          title="Không tìm thấy từ"
          description="Từ này chưa có trong từ điển. Hãy thử cách viết khác, hoặc dùng AI phân tích để tìm hiểu từ mới."
        >
          <Link
            href={`/ai-import?hint=${encodeURIComponent(query)}`}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" /> Phân tích bằng AI
            </span>
          </Link>
        </EmptyState>
      )}

      {!loading && !searched && query.length > 0 && query.length < 2 && (
        <p className="text-center text-sm text-muted-foreground">Gõ ít nhất 2 ký tự để tìm kiếm.</p>
      )}

      {!loading && !searched && query.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Tra từ tiếng Anh hoặc tiếng Trung tức thì. Ví dụ: <b className="text-foreground">wander</b>,{" "}
          <b className="text-foreground">努力学习</b>, <b className="text-foreground">学习</b>...
        </div>
      )}
    </div>
  );
}