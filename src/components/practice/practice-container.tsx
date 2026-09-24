"use client";

import { useState } from "react";
import { Brain, ChevronRight, Dumbbell, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRACTICE_TYPES } from "@/services/practice.service";
import { PracticeSession } from "./practice-session";
import type { PracticeType, VocabLanguage } from "@/types";

const LANGUAGE_TABS: { value: VocabLanguage; label: string }[] = [
  { value: "english", label: "🇬🇧 Tiếng Anh" },
  { value: "chinese", label: "🇨🇳 Tiếng Trung" },
];

const TYPE_TONES: Record<PracticeType, string> = {
  "multiple-choice": "bg-primary/10 text-primary",
  "fill-blank": "bg-sky-500/10 text-sky-600",
  listening: "bg-violet-500/10 text-violet-600",
  translate: "bg-amber-500/10 text-amber-600",
  pinyin: "bg-rose-500/10 text-rose-600",
  hanzi: "bg-emerald-500/10 text-emerald-600",
  scramble: "bg-orange-500/10 text-orange-600",
};

export interface PracticeSettings {
  type: PracticeType;
  language: VocabLanguage;
}

export function PracticeContainer() {
  const [settings, setSettings] = useState<PracticeSettings | null>(null);
  const [language, setLanguage] = useState<VocabLanguage>("english");

  if (settings) {
    return (
      <PracticeSession
        key={`${settings.type}-${settings.language}`}
        type={settings.type}
        language={settings.language}
        onExit={() => setSettings(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Dumbbell className="size-7 text-primary" /> Luyện tập
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn loại bài tập và biến việc học từ vựng thành kỹ năng sử dụng.
          </p>
        </div>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-2xl border border-border bg-card p-1">
        {LANGUAGE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setLanguage(t.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              language === t.value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_TYPES.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => setSettings({ type: p.type, language })}
            className="card-hover group flex items-start gap-3 rounded-3xl border border-border bg-card p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", TYPE_TONES[p.type])}>
              <Brain className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-semibold">
                {p.titleVi}
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{p.description}</span>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="size-3" /> +10 XP/đáp án đúng
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
        💡 <b className="text-foreground">Mẹo:</b> Hãy học từ vựng trước khi luyện tập để đạt kết quả tốt nhất. Các
        câu hỏi được tạo ngẫu nhiên từ từ vựng của bạn.
      </div>
    </div>
  );
}