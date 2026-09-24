import Link from "next/link";
import { BookOpen } from "lucide-react";

import { FlashcardSession, type FlashcardItem } from "@/components/learning/flashcard-session";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getLearnDeck, type DeckOptions } from "@/services/vocabulary.service";
import { getTopics } from "@/services/topics.service";
import { requireUser } from "@/services/auth.service";
import { cn } from "@/lib/utils";
import type { VocabLanguage } from "@/types";

export const dynamic = "force-dynamic";

interface LearnPageProps {
  searchParams: Promise<{ language?: string; topic?: string }>;
}

const LANGUAGE_TABS: { value: "all" | VocabLanguage; label: string }[] = [
  { value: "all", label: "🌎 Tất cả" },
  { value: "english", label: "🇬🇧 Tiếng Anh" },
  { value: "chinese", label: "🇨🇳 Tiếng Trung" },
];

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const tab = params.language ?? (user.language === "both" ? "all" : user.language);
  const language = tab === "all" ? "all" : (tab as VocabLanguage);
  const topicSlug = params.topic;

  const options: DeckOptions = {
    userId: user.id,
    language,
    limit: 15,
    includeLearned: tab === "all" || user.language === "both",
  };
  if (topicSlug) options.topicSlug = topicSlug;

  const [deck, topics] = await Promise.all([getLearnDeck(options), getTopics(user.id)]);

  const items: FlashcardItem[] = deck.map((v) => ({
    vocabularyId: v.id,
    language: v.language as VocabLanguage,
    word: v.word,
    pronunciation: v.pronunciation,
    pinyin: v.pinyin,
    traditional: v.traditional,
    meaningVi: v.meaningVi,
    partOfSpeech: v.partOfSpeech,
    exampleSentence: v.exampleSentence,
    exampleTranslation: v.exampleTranslation,
    charAnalysis: v.charAnalysis,
    alreadyLearned: Boolean(v.userVocabulary),
  }));

  const topicName = topicSlug ? topics.find((t) => t.slug === topicSlug)?.nameVi : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <BookOpen className="size-7 text-primary" /> Học từ vựng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            15 từ mới mỗi lượt. Lật thẻ ghi nhớ rồi đánh giá để lên lịch ôn tập thông minh.
          </p>
        </div>
        {topicSlug && (
          <Link href="/learn" className={buttonVariants({ variant: "outline", size: "sm" })}>
            ✕ Bỏ chọn chủ đề
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
          {LANGUAGE_TABS.map((t) => (
            <Link
              key={t.value}
              href={`/learn?language=${t.value}`}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                tab === t.value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <Link href="/topics" className={buttonVariants({ variant: "soft", size: "sm" })}>
          Học theo chủ đề
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="book"
          title="Hết từ mới để học rồi!"
          description="Bạn đã học hết các từ trong bộ thẻ này. Hãy luyện tập hoặc xem thử các chủ đề khác."
        >
          <div className="flex gap-2">
            <Link href="/practice" className={buttonVariants({ size: "sm" })}>
              Luyện tập ngay
            </Link>
            <Link href="/topics" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Chọn chủ đề
            </Link>
          </div>
        </EmptyState>
      ) : (
        <FlashcardSession items={items} topicName={topicName} />
      )}
    </div>
  );
}