import Link from "next/link";
import { Brain, Clock, Flame } from "lucide-react";

import { ReviewSession, type ReviewItem } from "@/components/learning/review-session";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getReviewSummary, getReviewQueue } from "@/services/review.service";
import { requireUser } from "@/services/auth.service";
import type { VocabLanguage } from "@/types";

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  searchParams: Promise<{ language?: string }>;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const language = (params.language ?? "all") === "all" ? "all" : (params.language as VocabLanguage);

  const [summary, queue] = await Promise.all([
    getReviewSummary(user.id),
    getReviewQueue(user.id, { language, limit: 30 }),
  ]);

  const items: ReviewItem[] = queue.map((q) => ({
    userVocabId: q.userVocabId,
    vocabularyId: q.vocabularyId,
    language: q.language,
    word: q.word,
    pronunciation: q.pronunciation,
    pinyin: q.pinyin,
    traditional: q.traditional,
    meaningVi: q.meaningVi,
    partOfSpeech: q.partOfSpeech,
    exampleSentence: q.exampleSentence,
    exampleTranslation: q.exampleTranslation,
    charAnalysis: q.charAnalysis,
    masteryLevel: q.masteryLevel,
    correctCount: q.correctCount,
    incorrectCount: q.incorrectCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Brain className="size-7 text-primary" /> Ôn tập
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lặp lại ngắt quãng giúp chuyển kiến thức từ trí nhớ ngắn hạn sang dài hạn.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
              <Brain className="size-5 text-primary" />
            </span>
            <div>
              <p className="text-xl font-bold">{summary.dueCount}</p>
              <p className="text-xs text-muted-foreground">Từ đến hạn ôn ({summary.overdueCount} quá hạn)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-500/10">
              <Flame className="size-5 text-orange-500" />
            </span>
            <div>
              <p className="text-xl font-bold">{summary.streak} ngày</p>
              <p className="text-xs text-muted-foreground">Độ chính xác {summary.accuracy}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-success/10">
              <Clock className="size-5 text-success" />
            </span>
            <div>
              <p className="text-xl font-bold">{summary.estimatedTime}</p>
              <p className="text-xs text-muted-foreground">Thời gian ước tính để ôn hết</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-success/10">
              <Brain className="size-8 text-success" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Không còn từ nào cần ôn</h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Tất cả từ vựng đã được ôn tập. Quay lại sau khi học từ mới hoặc luyện tập để củng cố.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/learn" className={buttonVariants({ size: "sm" })}>
                Học từ mới
              </Link>
              <Link href="/practice" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Luyện tập
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReviewSession initialItems={items} />
      )}
    </div>
  );
}