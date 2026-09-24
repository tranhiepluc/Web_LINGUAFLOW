"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AudioButton } from "@/components/shared/audio-button";
import { masteryLabel, masteryPercent } from "@/lib/spaced-repetition";
import { formatDateVi } from "@/lib/utils";
import { removeUserVocabularyAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { useDebounce } from "@/hooks/use-debounce";
import { Progress } from "@/components/ui/progress";
import type { VocabLanguage } from "@/types";

export interface VocabListItem {
  id: string;
  status: string;
  masteryLevel: number;
  nextReviewAt: Date | null;
  createdAt: Date;
  vocabulary: {
    id: string;
    word: string;
    meaningVi: string;
    language: string;
    pinyin: string | null;
    pronunciation: string | null;
  };
}

export interface VocabularyFiltersProps {
  items: VocabListItem[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "learning", label: "Đang học" },
  { value: "review", label: "Đã quen" },
  { value: "mastered", label: "Thành thạo" },
];

const LANGUAGE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "🌎 Tất cả" },
  { value: "english", label: "🇬🇧 Anh" },
  { value: "chinese", label: "🇨🇳 Trung" },
];

export function VocabularyView({ items, total, page, totalPages, statusCounts }: VocabularyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounced = useDebounce(query, 300);

  const status = searchParams.get("status") ?? "all";
  const language = searchParams.get("language") ?? "all";
  const sort = searchParams.get("sort") ?? "recent";

  const updateParams = (key: string, value: string, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    if (resetPage) params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (debounced !== (searchParams.get("q") ?? "")) {
      updateParams("q", debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const removeItem = async (id: string, word: string) => {
    if (!window.confirm(`Xóa từ "${word}" khỏi thư viện của bạn?`)) return;
    try {
      await removeUserVocabularyAction(id);
      toast.success(`Đã xóa "${word}"`);
      router.refresh();
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    }
  };

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const countFor = statusCounts[status] ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trong từ vựng của bạn..."
            className="pl-9 sm:max-w-xs"
          />
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Select value={sort} onChange={(e) => updateParams("sort", e.target.value)} className="w-40">
          <option value="recent">Mới thêm trước</option>
          <option value="alphabet">A → Z</option>
          <option value="difficulty">Khó trước</option>
          <option value="nextReview">Đến hạn ôn trước</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            active={status === f.value}
            onClick={() => updateParams("status", f.value)}
            label={f.label}
            count={statusCounts[f.value] ?? 0}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {LANGUAGE_FILTERS.map((f) => (
          <FilterChip key={f.value} active={language === f.value} onClick={() => updateParams("language", f.value)} label={f.label} />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Hiển thị <b className="text-foreground">{Math.min(items.length, Math.max(0, total))}</b> từ · Tổng cộng{" "}
        <b className="text-foreground">{total}</b>
        {status !== "all" && <> · Nhóm &quot;{STATUS_FILTERS.find((f) => f.value === status)?.label}&quot; ({countFor})</>}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon="book"
          title="Chưa có từ vựng nào"
          description={
            query || status !== "all" || language !== "all"
              ? "Không tìm thấy từ nào phù hợp với bộ lọc hiện tại."
              : "Bạn chưa lưu từ nào. Hãy tra từ hoặc học flashcard để xây dựng thư viện."
          }
        >
          {(query || status !== "all" || language !== "all") ? (
            <Button variant="outline" size="sm" onClick={() => router.replace(pathname)}>
              Xóa bộ lọc
            </Button>
          ) : (
            <Link href="/dictionary" className={buttonVariants({ size: "sm" })}>
              Tra từ đầu tiên
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
            {items.map((item) => {
              const lang = item.vocabulary.language as VocabLanguage;
              return (
                <li key={item.id} className="flex items-center gap-3 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg">
                    {lang === "english" ? "🇬🇧" : "🇨🇳"}
                  </span>
                  <Link href={`/dictionary/${item.vocabulary.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold hover:text-primary">{item.vocabulary.word}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          item.status === "mastered"
                            ? "bg-success/10 text-success"
                            : item.status === "review"
                              ? "bg-primary/10 text-primary"
                              : item.status === "learning"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {masteryLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {item.vocabulary.meaningVi}
                      {lang === "chinese" && item.vocabulary.pinyin ? ` · ${item.vocabulary.pinyin}` : ""}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={masteryPercent(item.masteryLevel)} className="h-1.5 w-24" />
                      <span className="text-[11px] text-muted-foreground">
                        {item.nextReviewAt
                          ? `Ôn lại: ${formatDateVi(item.nextReviewAt)}`
                          : item.status === "new"
                            ? "Chưa bắt đầu học"
                            : "Sẵn sàng ôn tập"}
                      </span>
                    </div>
                  </Link>
                  <AudioButton text={item.vocabulary.word} language={lang} size="icon-sm" variant="ghost" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Xóa ${item.vocabulary.word}`}
                    onClick={() => removeItem(item.id, item.vocabulary.word)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                <ChevronLeft /> Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Sau <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
      {typeof count === "number" && count > 0 && (
        <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-white/20" : "bg-secondary")}>{count}</span>
      )}
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}