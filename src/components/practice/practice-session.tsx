"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Flame,
  Keyboard,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AudioButton } from "@/components/shared/audio-button";
import { evaluateAnswer } from "@/lib/practice";
import { generatePracticeAction, savePracticeAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { useKeyboardBindings } from "@/hooks/use-keyboard";
import { PRACTICE_TYPES } from "@/services/practice.service";
import type { PracticeQuestion, PracticeType, VocabLanguage } from "@/types";
import { useIsMobile } from "@/hooks/use-media-query";

interface PracticeSummary {
  score: number;
  correct: number;
  incorrect: number;
  total: number;
  xpEarned: number;
  streak: number;
  goalAchieved: boolean;
  todayLearned: number;
  dailyGoal: number;
}

type Phase = "answer" | "feedback";

export function PracticeSession({
  type,
  language,
  onExit,
}: {
  type: PracticeType;
  language: VocabLanguage;
  onExit: () => void;
}) {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answer");
  const [choice, setChoice] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [tokenOrder, setTokenOrder] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; userAnswer: string } | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; userAnswer: string; correctAnswer: string }[]>([]);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const info = useMemo(() => PRACTICE_TYPES.find((t) => t.type === type)!, [type]);
  const current = questions[index];

  useEffect(() => {
    let cancelled = false;
    generatePracticeAction(type, language)
      .then((q) => {
        if (cancelled) return;
        setQuestions(q);
        if (q.length === 0) setError("Không đủ dữ liệu để tạo bài tập. Hãy học thêm từ vựng trước.");
      })
      .catch((err) => {
        if (!cancelled) setError(toVietnameseMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, language]);

  useEffect(() => {
    setPhase("answer");
    setChoice(null);
    setTextAnswer("");
    setTokenOrder([]);
    setFeedback(null);
    inputRef.current?.focus();
  }, [index]);

  const check = () => {
    if (!current || phase === "feedback") return;

    let userAnswer = "";
    if (current.choices) {
      if (choice === null) {
        toast.error("Hãy chọn một đáp án");
        return;
      }
      userAnswer = current.choices[choice].value;
    } else if (current.tokens) {
      if (tokenOrder.length < current.tokens.length) {
        toast.error("Hãy sắp xếp đủ các từ");
        return;
      }
      userAnswer = language === "chinese" ? tokenOrder.join("") : tokenOrder.join(" ");
    } else {
      userAnswer = textAnswer.trim();
      if (!userAnswer) {
        toast.error("Hãy nhập câu trả lời");
        return;
      }
    }

    const correct = evaluateAnswer(type, userAnswer, current.answer);
    setFeedback({ correct, userAnswer });
    setPhase("feedback");
  };

  const next = () => {
    if (!current) return;
    const record = {
      questionId: current.id,
      userAnswer: feedback?.userAnswer ?? "",
      correctAnswer: current.answer,
    };
    const all = [...answers, record];
    setAnswers(all);

    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    savePracticeAction({ type, language, answers: all })
      .then((res) => {
        setSummary({
          score: res.score,
          correct: res.correct,
          incorrect: res.incorrect,
          total: res.total,
          xpEarned: res.xpEarned,
          streak: res.streak,
          goalAchieved: res.goalAchieved,
          todayLearned: res.todayLearned,
          dailyGoal: res.dailyGoal,
        });
        setSubmitting(false);
      })
      .catch((err) => {
        toast.error(toVietnameseMessage(err));
        setSubmitting(false);
      });
  };

  const restart = () => {
    setIndex(0);
    setAnswers([]);
    setSummary(null);
    setLoading(true);
    setError(null);
    generatePracticeAction(type, language)
      .then(setQuestions)
      .catch((err) => setError(toVietnameseMessage(err)))
      .finally(() => setLoading(false));
  };

  useKeyboardBindings(
    [
      { key: "Enter", action: () => (phase === "answer" ? check() : next()), label: "Tiếp theo" },
      { key: "ArrowLeft", action: onExit, label: "" },
    ],
    !summary && !loading && Boolean(current),
  );

  if (summary) {
    return (
      <div className="animate-scale-in mx-auto max-w-md space-y-6 py-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10">
          {summary.score >= 80 ? (
            <Trophy className="size-10 text-primary" />
          ) : (
            <Dumbbell className="size-10 text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {summary.score >= 80 ? "Xuất sắc!" : summary.score >= 50 ? "Khá tốt!" : "Tiếp tục cố gắng!"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Điểm số <b className="text-foreground">{summary.score}/100</b> · {summary.correct}/{summary.total} câu đúng
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

        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/learn" className={buttonVariants({ size: "sm" })}>
            Học từ mới
          </Link>
          <Link href="/review" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ôn tập
          </Link>
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw /> Làm lại
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10">
        <div className="mx-auto h-2 w-full max-w-md animate-pulse rounded-full bg-secondary" />
        <div className="h-[320px] animate-pulse rounded-3xl bg-secondary/60" />
        <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-destructive/10">
          <X className="size-8 text-destructive" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Không thể tạo bài tập</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Không đủ dữ liệu từ vựng."}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/learn" className={buttonVariants({ size: "sm" })}>
            Học từ mới trước
          </Link>
          <Button variant="outline" size="sm" onClick={onExit}>
            Chọn bài tập khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Thoát
        </button>
        <div className="flex-1">
          <Progress value={(index / questions.length) * 100} className="mx-auto h-2 max-w-md" />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={restart} title="Làm lại">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {type === "pinyin" || type === "hanzi" ? "🇨🇳" : language === "chinese" ? "🇨🇳" : "🇬🇧"}
          {language === "chinese" || type === "pinyin" || type === "hanzi" ? " Tiếng Trung" : " Tiếng Anh"}
        </span>
        <h1 className="mt-2 text-xl font-bold">{info.titleVi}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Câu {index + 1} / {questions.length} · {info.description}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="whitespace-pre-wrap text-lg font-medium leading-relaxed">{current.prompt}</p>
            {current.subtitle && (
              <p className="text-sm text-muted-foreground">{current.subtitle}</p>
            )}
            {type === "listening" && current.word && (
              <AudioButton text={current.word} language={language} size="sm" label="Nghe lại" />
            )}
            {(type === "fill-blank" || type === "translate" || type === "pinyin" || type === "scramble") && (
              <p className="text-xs text-muted-foreground">Mẹo: nhấn Enter để kiểm tra.</p>
            )}
          </div>
        </div>

        {current.choices ? (
          <div className={cn("grid gap-2.5", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            {current.choices.map((c, i) => {
              const selected = choice === i;
              const showCorrect = phase === "feedback" && c.isCorrect;
              const showWrong = phase === "feedback" && selected && !c.isCorrect;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={phase === "feedback"}
                  onClick={() => setChoice(i)}
                  className={cn(
                    "flex min-h-12 items-center rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    showCorrect
                      ? "border-success bg-success/10 text-success"
                      : showWrong
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  <span className="mr-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {showCorrect && <Check className="size-4" />}
                  {showWrong && <X className="size-4" />}
                </button>
              );
            })}
          </div>
        ) : current.tokens ? (
          <div className="space-y-4">
            <div className="flex min-h-14 flex-wrap gap-2 rounded-2xl border-2 border-dashed border-input bg-secondary/30 p-3">
              {tokenOrder.length === 0 && (
                <span className="self-center text-sm text-muted-foreground">Chạm vào từ để tạo câu...</span>
              )}
              {tokenOrder.map((token, i) => (
                <button
                  key={`${token}-${i}`}
                  type="button"
                  onClick={() => setTokenOrder((t) => t.filter((_, j) => j !== i))}
                  className="animate-scale-in rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm"
                >
                  {token} <span className="ml-1 text-white/70">✕</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {current.tokens.map((token) => {
                const used = tokenOrder.filter((t) => t === token).length;
                const total = current.tokens!.filter((t) => t === token).length;
                const disabled = used >= total;
                return (
                  <button
                    key={`${token}-${used}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTokenOrder((o) => [...o, token])}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 disabled:opacity-30"
                  >
                    {token}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              ref={inputRef}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder={
                type === "pinyin"
                  ? "Nhập pinyin có dấu thanh..."
                  : type === "translate"
                    ? "Viết câu dịch (có thể dùng từ đơn giản hơn)..."
                    : "Nhập câu trả lời..."
              }
              className="h-12 text-base"
              disabled={phase === "feedback"}
            />
            {type === "pinyin" && (
              <p className="text-xs text-muted-foreground">
                Gõ pinyin có dấu thanh, ví dụ: <b>hǎi</b>. Nếu khó gõ dấu thanh, hệ thống vẫn chấp nhận chữ
                thường không dấu.
              </p>
            )}
          </div>
        )}

        {phase === "feedback" && feedback && (
          <div className="mt-5 space-y-3">
            <div
              className={cn(
                "flex items-start gap-3 rounded-2xl border-2 p-4",
                feedback.correct ? "border-success/40 bg-success/10" : "border-destructive/30 bg-destructive/10",
              )}
            >
              {feedback.correct ? (
                <Check className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <X className="mt-0.5 size-5 shrink-0 text-destructive" />
              )}
              <div className="text-sm">
                <p className="font-semibold">
                  {feedback.correct ? "Chính xác! 🎉" : "Chưa đúng. Đáp án:"}
                </p>
                <p className="mt-1 font-medium">{current.answer}</p>
                {current.explanation && (
                  <p className="mt-1.5 text-muted-foreground">{current.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {phase === "answer" ? (
          <Button size="lg" onClick={check} className="min-w-44">
            Kiểm tra <Keyboard className="size-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={next} className="min-w-44" disabled={submitting}>
            {submitting ? "Đang lưu kết quả..." : index + 1 < questions.length ? "Câu tiếp theo" : "Hoàn thành"}
            {!submitting && <ArrowRight />}
          </Button>
        )}
      </div>
    </div>
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