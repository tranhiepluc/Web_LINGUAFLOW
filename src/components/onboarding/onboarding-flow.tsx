"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { onboardingSchema } from "@/lib/validations";
import { completeOnboardingAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";

const LANGUAGE_OPTIONS = [
  { value: "english", label: "Tiếng Anh", flag: "🇬🇧", desc: "Giao tiếp, công việc, IELTS..." },
  { value: "chinese", label: "Tiếng Trung", flag: "🇨🇳", desc: "HSK, giao tiếp, du lịch..." },
  { value: "both", label: "Cả hai", flag: "🌎", desc: "Chinh phục song song 2 ngôn ngữ" },
] as const;

const MOTIVATIONS = [
  { value: "giao_tiep", label: "Giao tiếp", icon: "💬" },
  { value: "du_lich", label: "Du lịch", icon: "✈️" },
  { value: "cong_viec", label: "Công việc", icon: "💼" },
  { value: "ielts", label: "IELTS", icon: "🎓" },
  { value: "toeic", label: "TOEIC", icon: "📋" },
  { value: "hsk", label: "HSK", icon: "🀄" },
  { value: "phat_trien", label: "Phát triển bản thân", icon: "🌱" },
] as const;

const ENGLISH_LEVELS = [
  { value: "beginner", label: "Mới bắt đầu" },
  { value: "elementary", label: "Sơ cấp" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "upper_intermediate", label: "Trung cấp cao" },
  { value: "advanced", label: "Nâng cao" },
] as const;

const CHINESE_LEVELS = [
  { value: "hsk1", label: "HSK 1" },
  { value: "hsk2", label: "HSK 2" },
  { value: "hsk3", label: "HSK 3" },
  { value: "hsk4", label: "HSK 4" },
  { value: "hsk5", label: "HSK 5" },
  { value: "hsk6", label: "HSK 6" },
] as const;

const STEPS = ["Ngôn ngữ", "Trình độ", "Mục tiêu"];

export function OnboardingFlow({ initialLanguage }: { initialLanguage: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState(initialLanguage === "both" ? "both" : initialLanguage);
  const [englishLevel, setEnglishLevel] = useState("");
  const [chineseLevel, setChineseLevel] = useState("");
  const [goalDaily, setGoalDaily] = useState(10);
  const [motivation, setMotivation] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canNext = (): string | null => {
    if (step === 0 && !language) return "Hãy chọn ngôn ngữ bạn muốn học";
    if (step === 1) {
      if ((language === "english" || language === "both") && !englishLevel) return "Hãy chọn trình độ tiếng Anh";
      if ((language === "chinese" || language === "both") && !chineseLevel) return "Hãy chọn trình độ tiếng Trung";
    }
    if (step === 2 && !goalDaily) return "Hãy chọn mục tiêu từ/ngày";
    return null;
  };

  const next = () => {
    const error = canNext();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const error = canNext();
    if (error) {
      toast.error(error);
      return;
    }
    if (motivation.length === 0) {
      toast.error("Hãy chọn mục tiêu học tập của bạn");
      return;
    }

    const parsed = onboardingSchema.safeParse({
      language,
      englishLevel: language === "chinese" ? undefined : englishLevel,
      chineseLevel: language === "english" ? undefined : chineseLevel,
      goalDaily,
      motivation: motivation.join(","),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Thông tin không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboardingAction(parsed.data);
      toast.success("Hoàn tất thiết lập! Chúc bạn học vui 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(toVietnameseMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5 self-center">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-white">LF</span>
        <span className="text-lg font-bold tracking-tight">
          LINGUA<span className="text-primary">FLOW</span>
        </span>
      </Link>

      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-secondary text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-6 p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold">Bạn muốn học ngôn ngữ nào?</h1>
                <p className="text-sm text-muted-foreground">Có thể thay đổi bất cứ lúc nào trong Cài đặt.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLanguage(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      language === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <span className="text-3xl">{opt.flag}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold">Trình độ hiện tại của bạn?</h1>
                <p className="text-sm text-muted-foreground">
                  Chọn mức phù hợp nhất — LINGUAFLOW sẽ gợi ý từ vựng theo trình độ.
                </p>
              </div>

              <div className="space-y-4">
                {(language === "english" || language === "both") && (
                  <LevelGroup
                    title="🇬🇧 Trình độ tiếng Anh"
                    options={ENGLISH_LEVELS.map((o) => ({ value: o.value, label: o.label }))}
                    value={englishLevel}
                    onChange={setEnglishLevel}
                  />
                )}
                {(language === "chinese" || language === "both") && (
                  <LevelGroup
                    title="🇨🇳 Trình độ tiếng Trung"
                    options={CHINESE_LEVELS.map((o) => ({ value: o.value, label: o.label }))}
                    value={chineseLevel}
                    onChange={setChineseLevel}
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold">Thiết lập thói quen học tập</h1>
                <p className="text-sm text-muted-foreground">10–20 từ/ngày là con số lý tưởng để duy trì lâu dài.</p>
              </div>

              <LevelGroup
                title="Mục tiêu từ mới mỗi ngày"
                options={[10, 20, 30, 50].map((n) => ({ value: String(n), label: `${n} từ/ngày` }))}
                value={String(goalDaily)}
                onChange={(v) => setGoalDaily(Number(v))}
                cols={4}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Động lực học tập chính?</p>
                <p className="text-xs text-muted-foreground">Chọn một hoặc nhiều mục tiêu bạn đang hướng tới.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MOTIVATIONS.map((m) => {
                    const active = motivation.includes(m.value);
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() =>
                          setMotivation((prev) =>
                            active ? prev.filter((v) => v !== m.value) : [...prev, m.value],
                          )
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                        )}
                      >
                        <span>{m.icon}</span>
                        {m.label}
                        <span
                          className={cn(
                            "ml-auto flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                            active ? "border-primary bg-primary" : "border-muted-foreground/40",
                          )}
                        >
                          {active && <Check className="size-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
        >
          <ArrowLeft /> Quay lại
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Tiếp theo <ArrowRight />
          </Button>
        ) : (
          <Button onClick={submit} size="lg" disabled={submitting}>
            {submitting ? (
              "Đang thiết lập..."
            ) : (
              <>
                <Rocket /> Bắt đầu hành trình
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function LevelGroup({
  title,
  options,
  value,
  onChange,
  cols = 2,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  cols?: 2 | 3 | 4;
}) {
  const colsClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[cols];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className={cn("grid grid-cols-1 gap-2", colsClass)}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                value === o.value ? "border-primary bg-primary" : "border-muted-foreground/40",
              )}
            >
              {value === o.value && <Check className="size-3 text-white" />}
            </span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}