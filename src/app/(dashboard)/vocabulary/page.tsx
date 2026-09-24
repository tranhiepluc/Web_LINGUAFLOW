import type { Metadata } from "next";
import { Library } from "lucide-react";

import { VocabularyView, type VocabListItem } from "@/components/vocabulary/vocabulary-view";
import { getMyVocabularies } from "@/services/vocabulary.service";
import { requireUser } from "@/services/auth.service";

export const metadata: Metadata = {
  title: "Từ vựng của tôi · LINGUAFLOW",
};

export const dynamic = "force-dynamic";

interface VocabularyPageProps {
  searchParams: Promise<{
    q?: string;
    language?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function VocabularyPage({ searchParams }: VocabularyPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const { items, total, page, totalPages, statusCounts } = await getMyVocabularies(user.id, {
    q: params.q,
    language: params.language as never,
    status: (params.status ?? "all") as never,
    sort: params.sort as never,
    page: Number(params.page ?? 1),
    pageSize: 12,
  });

  const list: VocabListItem[] = items.map((i) => ({
    id: i.id,
    status: i.status,
    masteryLevel: i.masteryLevel,
    nextReviewAt: i.nextReviewAt,
    createdAt: i.createdAt,
    vocabulary: {
      id: i.vocabulary.id,
      word: i.vocabulary.word,
      meaningVi: i.vocabulary.meaningVi,
      language: i.vocabulary.language,
      pinyin: i.vocabulary.pinyin,
      pronunciation: i.vocabulary.pronunciation,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Library className="size-7 text-primary" /> Từ vựng của tôi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toàn bộ từ bạn đã lưu và học, cùng lịch ôn tập thông minh.
          </p>
        </div>
      </div>

      <VocabularyView
        items={list}
        total={total}
        page={page}
        totalPages={totalPages}
        statusCounts={statusCounts}
      />
    </div>
  );
}