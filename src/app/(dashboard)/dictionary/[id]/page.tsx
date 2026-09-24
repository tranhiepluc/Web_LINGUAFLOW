import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { SaveVocabularyButton } from "@/components/shared/save-vocabulary-button";
import { AudioButton } from "@/components/shared/audio-button";
import { getVocabularyById, getRelatedVocabulary } from "@/services/vocabulary.service";
import { requireUser } from "@/services/auth.service";
import type { VocabLanguage } from "@/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tra từ · LINGUAFLOW",
};

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DictionaryDetailPage({ params }: DetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const vocab = await getVocabularyById(id);

  if (!vocab) {
    return (
      <div className="py-10">
        <EmptyState icon="search" title="Không tìm thấy từ này" description="Từ có thể đã bị xóa hoặc không tồn tại.">
          <Link href="/dictionary" className={buttonVariants({ size: "sm" })}>
            <ChevronLeft /> Quay lại tra cứu
          </Link>
        </EmptyState>
      </div>
    );
  }

  const related = await getRelatedVocabulary(vocab);

  const userVocab = await vocabularyLookup(user.id, vocab.id);
  const saved = Boolean(userVocab?.isSaved);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dictionary" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Tra từ khác
      </Link>

      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">{vocab.language === "english" ? "🇬🇧" : "🇨🇳"}</span>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{vocab.word}</h1>
                {vocab.partOfSpeech && <Badge variant="secondary">{vocab.partOfSpeech}</Badge>}
                {vocab.difficulty > 0 && <Badge>Độ khó {vocab.difficulty}/5</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                {vocab.language === "english" && vocab.pronunciation ? (
                  <span className="text-lg">{vocab.pronunciation}</span>
                ) : null}
                {vocab.language === "chinese" && (
                  <>
                    {vocab.pinyin && <span className="text-lg font-medium text-foreground">{vocab.pinyin}</span>}
                    {vocab.traditional && (
                      <span className="rounded-lg bg-secondary px-2 py-0.5 text-xs">
                        Phồn thể: {vocab.traditional}
                      </span>
                    )}
                  </>
                )}
                <AudioButton text={vocab.word} language={vocab.language as VocabLanguage} />
              </div>
            </div>
            <SaveVocabularyButton vocabularyId={vocab.id} word={vocab.word} saved={saved} />
          </div>

          <p className="text-xl font-semibold text-foreground">{vocab.meaningVi}</p>

          {vocab.language === "chinese" && vocab.charAnalysis && (
            <div className="rounded-2xl bg-accent/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phân tích chữ Hán</p>
              <p className="mt-1 text-sm leading-relaxed">{vocab.charAnalysis}</p>
            </div>
          )}

          {vocab.exampleSentence && (
            <div className="space-y-1 rounded-2xl bg-secondary/50 p-4">
              <p className="text-base font-medium">{vocab.exampleSentence}</p>
              {vocab.exampleTranslation && <p className="text-sm text-muted-foreground">{vocab.exampleTranslation}</p>}
            </div>
          )}

        </CardContent>
      </Card>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <RelatedIcon /> Từ liên quan
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/dictionary/${r.id}`}
                className="card-hover rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold hover:text-primary">{r.word}</span>
                  {r.partOfSpeech && <Badge variant="secondary" className="text-[10px]">{r.partOfSpeech}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.meaningVi}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RelatedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 text-primary">
      <path d="M4 19V5M4 19h16M4 12h16M8 8h8M8 16h8" />
    </svg>
  );
}

async function vocabularyLookup(userId: string, vocabularyId: string) {
  const { prisma } = await import("@/lib/db");
  return prisma.userVocabulary.findUnique({
    where: { userId_vocabularyId: { userId, vocabularyId } },
  });
}