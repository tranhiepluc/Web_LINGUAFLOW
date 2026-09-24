"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Flame, PlayCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AudioButton } from "@/components/shared/audio-button";
import { completeLearnSessionAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { useKeyboardBindings } from "@/hooks/use-keyboard";
import type { VocabLanguage } from "@/types";

export interface FlashcardItem {
  vocabularyId: string;
  language: VocabLanguage;
  word: string;
  pronunciation: string | null;
  pinyin: string | null;
  traditional: string | null;
  meaningVi: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  charAnalysis: string | null;
  alreadyLearned: boolean;
}

interface SessionSummary {
  total: number;
  xpEarned: number;
  streak: number;
  goalAchieved: boolean;
  todayLearned: number;
  dailyGoal: number;
  againCount: number;
}

export function FlashcardSession({ items, topicName }: { items: FlashcardItem[]; topicName?: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grades, setGrades] = useState<Record<string, "again" | "good">>({});
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const current = items[index];
  const doneCount = Object.keys(grades).length;
  const progress = items.length ? (doneCount / items.length) * 100 : 0;

  const grade = (g: "again" | "good") => {
    if (!current || flipped === false) return;
    setGrades((prev) => ({ ...prev, [current.vocabularyId]: g }));
    setFlipped(false);
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      finishSession(g);
    }
  };

  const finishSession = async (lastGrade: "again" | "good") => {
    const allGrades = { ...grades, [current.vocabularyId]: lastGrade };
    setSubmitting(true);
    const answers = Object.entries(allGrades).map(([vocabularyId, grade]) => ({ vocabularyId, grade }));
    try {
      const res = await completeLearnSessionAction(answers);
      const againCount = Object.values(allGrades).filter((g) => g === "again").length;
      setSummary({
        total: res.total,
        xpEarned: res.xpEarned,
        streak: res.streak,
        goalAchieved: res.goalAchieved,
        todayLearned: res.todayLearned,
        dailyGoal: res.dailyGoal,
        againCount,
      });
    } catch (error) {
      toast.error(toVietnameseMessage(error));
      setSubmitting(false);
    }
  };

  const exit = () => router.push("/dashboard");

  useKeyboardBindings(
    [
      { key: " ", action: () => setFlipped((f) => !f), label: "Lật thẻ", repeat: true },
      { key: "1", action: () => grade("again"), label: "Chưa nhớ" },
      { key: "2", action: () => grade("good"), label: "Đã nhớ" },
      { key: "ArrowRight", action: () => setFlipped((f) => !f), label: "" },
      { key: "Escape", action: exit, label: "" },
    ],
    !summary && !submitting,
  );

  useEffect(() => {
    if (summary) {
      if (summary.goalAchieved) toast.success("Bạn đã hoàn thành mục tiêu hôm nay! 🎯");
      if (summary.streak >= 7) toast.success(`Streak ${summary.streak} ngày! 🔥`);
    }
  }, [summary]);

  // ---------------- Summary ----------------
  if (summary) {
    return (
      <div className="animate-scale-in mx-auto max-w-md space-y-6 py-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10">
          <Sparkles className="size-10 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Buổi học hoàn tất! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            Bạn đã học <b className="text-foreground">{summary.total}</b> từ mới trong buổi này.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryStat icon={Sparkles} value={`+${summary.xpEarned}`} label="XP nhận được" tone="text-primary" />
          <SummaryStat icon={Flame} value={String(summary.streak)} label="Streak ngày" tone="text-orange-500" />
          <SummaryStat
            icon={summary.goalAchieved ? Check : X}
            value={`${summary.todayLearned}/${summary.dailyGoal}`}
            label="Mục tiêu hôm nay"
            tone={summary.goalAchieved ? "text-success" : "text-muted-foreground"}
          />
        </div>

        <div className="space-y-2.5">
          <Link href="/review" className={buttonVariants({ size: "lg", className: "w-full" })}>
            <PlayCircle /> Ôn tập từ đã học
          </Link>
          <Link href="/practice" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full" })}>
            Luyện tập ngay
          </Link>
          <Link href="/learn" className={buttonVariants({ size: "lg", variant: "ghost", className: "w-full" })}>
            <RotateCcw /> Học khác nữa
          </Link>
        </div>

        {summary.againCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Có <b className="text-foreground">{summary.againCount}</b> từ bạn chưa nhớ — chúng sẽ được lên lịch
            ôn lại sớm hơn.
          </p>
        )}
      </div>
    );
  }

  // ---------------- Session ----------------
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={exit}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Thoát
        </button>
        <div className="flex-1">
          <Progress value={progress} className="mx-auto h-2 max-w-md" />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => router.refresh()} title="Bắt đầu lại">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Từ {Math.min(index + 1, items.length)} / {items.length}
          {topicName ? <> · Chủ đề: <span className="text-foreground">{topicName}</span></> : null}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Nhấn <kbd>Space</kbd> để lật thẻ · <kbd>1</kbd> chưa nhớ · <kbd>2</kbd> đã nhớ
        </p>
      </div>

      {current ? (
        <>
          <div className="relative h-[380px] sm:h-[420px] [perspective:1200px]" onDoubleClick={() => setFlipped((f) => !f)}>
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]",
                flipped && "[transform:rotateY(180deg)]",
              )}
            >
              {/* Mặt trước */}
              <div className="card-hover absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-sm [backface-visibility:hidden]">
                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {current.language === "english" ? "🇬🇧 Tiếng Anh" : "🇨🇳 Tiếng Trung"}
                </span>
                <p
                  className={cn(
                    "font-bold text-foreground",
                    current.language === "english" ? "text-5xl sm:text-6xl" : "text-6xl",
                  )}
                >
                  {current.word}
                </p>
                {current.language === "english" ? (
                  current.pronunciation && (
                    <p className="text-lg text-muted-foreground">{current.pronunciation}</p>
                  )
                ) : (
                  <div className="space-y-1">
                    {current.pinyin && <p className="text-xl font-medium">{current.pinyin}</p>}
                    {current.traditional && current.traditional !== current.word && (
                      <p className="text-sm text-muted-foreground">Phồn thể: {current.traditional}</p>
                    )}
                  </div>
                )}
                {current.partOfSpeech && (
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {current.partOfSpeech}
                  </span>
                )}
                <AudioButton text={current.word} language={current.language} />
              </div>

              {/* Mặt sau */}
              <div className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {current.meaningVi}
                </span>
                {current.language === "english" && current.pronunciation && (
                  <p className="text-sm text-muted-foreground">{current.pronunciation}</p>
                )}
                {current.language === "chinese" && current.pinyin && (
                  <p className="text-lg font-medium">{current.pinyin}</p>
                )}
                {current.charAnalysis && (
                  <div className="max-w-sm rounded-2xl bg-accent/40 p-4 text-sm leading-relaxed">
                    {current.charAnalysis}
                  </div>
                )}
                {current.exampleSentence && (
                  <div className="space-y-1">
                    <p className={cn("text-lg font-medium", current.language === "english" && "font-serif italic")}>
                      {current.exampleSentence}
                    </p>
                    {current.exampleTranslation && (
                      <p className="text-sm text-muted-foreground">{current.exampleTranslation}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!flipped ? (
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setFlipped(true)} className="min-w-44">
                Lật thẻ xem nghĩa <ArrowRight />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => grade("again")}
                disabled={submitting}
              >
                <X /> Chưa nhớ (1)
              </Button>
              <Button size="lg" variant="success" className="h-14" onClick={() => grade("good")} disabled={submitting}>
                <Check /> Đã nhớ (2)
              </Button>
            </div>
          )}

          {submitting && !summary && (
            <p className="animate-pulse text-center text-sm text-muted-foreground">Đang lưu kết quả...</p>
          )}
        </>
      ) : (
        <p className="py-10 text-center text-muted-foreground">Không có từ nào để học.</p>
      )}
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Sparkles;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className={cn("mx-auto size-5", tone)} />
      <p className={cn("mt-1.5 text-lg font-bold", tone)}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}