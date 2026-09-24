"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { ArrowLeft, Brain, Check, Flame, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AudioButton } from "@/components/shared/audio-button";
import { GRADE_LABELS, type ReviewGrade } from "@/lib/spaced-repetition";
import { submitReviewsAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { useKeyboardBindings } from "@/hooks/use-keyboard";
import type { ReviewAnswer, VocabLanguage } from "@/types";

export interface ReviewItem {
  userVocabId: string;
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
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
}

const GRADE_ORDER: ReviewGrade[] = ["again", "hard", "good", "easy"];

const GRADE_STYLES: Record<ReviewGrade, string> = {
  again: "border-destructive/30 text-destructive hover:bg-destructive/10",
  hard: "border-warning/30 text-warning hover:bg-warning/10",
  good: "border-success/30 text-success hover:bg-success/10",
  easy: "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
};

interface ReviewSummary {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  xpEarned: number;
  streak: number;
  goalAchieved: boolean;
  todayLearned: number;
  dailyGoal: number;
}

export function ReviewSession({ initialItems }: { initialItems: ReviewItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [revealedAt, setRevealedAt] = useState<number | null>(null);
  const [grades, setGrades] = useState<GradeWithId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  const current = items[index];

  const grade = (g: ReviewGrade) => {
    if (!current) return;
    const responseMs = revealedAt ? Date.now() - revealedAt : 0;
    setGrades((prev) => [
      ...prev,
      { userVocabId: current.userVocabId, vocabularyId: current.vocabularyId, grade: g, responseMs },
    ]);
    setRevealed(false);
    setRevealedAt(null);
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
    } else if (index + 1 === items.length) {
      const all: ReviewAnswer[] = [
        ...grades,
        { userVocabId: current.userVocabId, vocabularyId: current.vocabularyId, grade: g, responseMs },
      ];
      void saveAll(all);
    }
  };

  const saveAll = async (all: ReviewAnswer[]) => {
    setSubmitting(true);
    try {
      const res = await submitReviewsAction(all);
      setSummary({
        total: res.total,
        correct: res.correct,
        incorrect: res.incorrect,
        accuracy: res.accuracy,
        xpEarned: res.xpEarned,
        streak: res.newStreak,
        goalAchieved: res.goalAchieved,
        todayLearned: res.todayLearned,
        dailyGoal: res.dailyGoal,
      });
    } catch (error) {
      toast.error(toVietnameseMessage(error));
      resetSession();
    }
  };

  const resetSession = () => {
    setItems(initialItems);
    setIndex(0);
    setRevealed(false);
    setGrades([]);
    setSubmitting(false);
    setSummary(null);
  };

  const exit = () => router.push("/dashboard");

  useKeyboardBindings(
    [
      { key: " ", action: () => reveal(), label: "Hiện đáp án", repeat: true },
      { key: "1", action: () => grade("again"), label: "Chưa nhớ" },
      { key: "2", action: () => grade("hard"), label: "Hơi nhớ" },
      { key: "3", action: () => grade("good"), label: "Đã nhớ" },
      { key: "4", action: () => grade("easy"), label: "Rất chắc" },
      { key: "Escape", action: exit, label: "" },
    ],
    !summary && !submitting,
  );

  const reveal = () => {
    if (!revealed) {
      setRevealed(true);
      setRevealedAt(Date.now());
    }
  };

  useEffect(() => {
    if (summary) {
      if (summary.goalAchieved) toast.success("Hoàn thành mục tiêu hôm nay! 🎯");
    }
  }, [summary]);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-success/10">
          <Check className="size-10 text-success" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Hết từ cần ôn hôm nay! 🎉</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn đã ôn tập đủ các từ đến hạn. Quay lại sau hoặc luyện tập thêm.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/dashboard" className={buttonVariants()}>
            Về trang chủ
          </Link>
          <Link href="/practice" className={buttonVariants({ variant: "outline" })}>
            Luyện tập
          </Link>
        </div>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="animate-scale-in mx-auto max-w-md space-y-6 py-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10">
          <Trophy className="size-10 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Ôn tập hoàn tất!</h2>
          <p className="text-sm text-muted-foreground">
            <b className="text-success">{summary.correct}</b> đúng · <b className="text-destructive">{summary.incorrect}</b> sai
            · độ chính xác <b>{summary.accuracy}%</b>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryStat icon={Sparkles} value={`+${summary.xpEarned}`} label="XP" tone="text-primary" />
          <SummaryStat icon={Flame} value={String(summary.streak)} label="Streak" tone="text-orange-500" />
          <SummaryStat
            icon={TargetIcon}
            value={`${summary.todayLearned}/${summary.dailyGoal}`}
            label="Hôm nay"
            tone={summary.goalAchieved ? "text-success" : "text-muted-foreground"}
          />
        </div>

        <div className="space-y-2.5">
          <Link href="/learn" className={buttonVariants({ size: "lg", className: "w-full" })}>
            Học từ mới tiếp
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full" })}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const masteredCount = current.masteryLevel;

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
          <Progress value={(index / items.length) * 100} className="mx-auto h-2 max-w-md" />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={resetSession} title="Làm lại">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Ôn tập từ {index + 1} / {items.length}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <kbd>Space</kbd> hiện đáp án · <kbd>1</kbd>–<kbd>4</kbd> chọn mức nhớ
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={reveal}
          className="card-hover relative min-h-[300px] w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[340px]"
        >
          {!revealed ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                {current.language === "english" ? "🇬🇧 Anh" : "🇨🇳 Trung"} · Từ cần ôn
              </span>
              <p className={cn("font-bold", current.language === "english" ? "text-5xl" : "text-6xl")}>
                {current.word}
              </p>
              {current.language === "english" && current.pronunciation && (
                <p className="text-lg text-muted-foreground">{current.pronunciation}</p>
              )}
              {current.language === "chinese" && current.pinyin && (
                <p className="text-xl font-medium">{current.pinyin}</p>
              )}
              <AudioButton text={current.word} language={current.language} />
              <p className="text-xs text-muted-foreground">Bạn còn nhớ nghĩa của từ này không?</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-center text-3xl font-bold">
                {current.word}
                <AudioButton text={current.word} language={current.language} size="icon-sm" />
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {current.meaningVi}
              </span>
              {current.partOfSpeech && (
                <span className="text-xs text-muted-foreground">{current.partOfSpeech}</span>
              )}
              {current.language === "chinese" && current.charAnalysis && (
                <p className="max-w-sm rounded-2xl bg-accent/40 p-3 text-sm">{current.charAnalysis}</p>
              )}
              {current.exampleSentence && (
                <div className="space-y-1">
                  <p className="font-medium">{current.exampleSentence}</p>
                  {current.exampleTranslation && (
                    <p className="text-sm text-muted-foreground">{current.exampleTranslation}</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className="size-3.5" />
                {masteredCount > 0 ? `Mức thuần thục ${masteredCount}/5` : "Từ mới trong vòng học"}
              </div>
            </div>
          )}
        </button>
      </div>

      {revealed ? (
        <div className="grid grid-cols-2 gap-3">
          <GradeButton grade="again" label={GRADE_LABELS.again} onClick={() => grade("again")} disabled={submitting} />
          <GradeButton grade="hard" label={GRADE_LABELS.hard} onClick={() => grade("hard")} disabled={submitting} />
          <GradeButton grade="good" label={GRADE_LABELS.good} onClick={() => grade("good")} disabled={submitting} />
          <GradeButton grade="easy" label={GRADE_LABELS.easy} onClick={() => grade("easy")} disabled={submitting} />
        </div>
      ) : (
        <div className="flex justify-center">
          <Button size="lg" onClick={reveal} className="min-w-44">
            Hiện đáp án
          </Button>
        </div>
      )}
    </div>
  );
}

interface GradeWithId {
  userVocabId: string;
  vocabularyId: string;
  grade: ReviewGrade;
  responseMs: number;
}

function GradeButton({
  grade,
  label,
  onClick,
  disabled,
}: {
  grade: ReviewGrade;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const hotkey = GRADE_ORDER.indexOf(grade) + 1;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-14 items-center justify-center gap-2 rounded-2xl border-2 bg-card text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
        GRADE_STYLES[grade],
      )}
    >
      <span className="hidden text-xs opacity-70 sm:inline">({hotkey})</span>
      {label}
    </button>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function SummaryStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
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