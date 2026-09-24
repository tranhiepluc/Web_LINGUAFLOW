import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PlayCircle } from "lucide-react";

import { getTopicDetail } from "@/services/topics.service";
import { requireUser } from "@/services/auth.service";
import { AudioButton } from "@/components/shared/audio-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { masteryLabel } from "@/lib/spaced-repetition";
import type { VocabLanguage } from "@/types";

export const dynamic = "force-dynamic";

interface TopicDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const user = await requireUser();
  const { slug } = await params;
  const topic = await getTopicDetail(user.id, slug);
  if (!topic) notFound();

  return (
    <div className="space-y-6">
      <Link href="/topics" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tất cả chủ đề
      </Link>

      <Card className="gradient-card">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-3xl bg-secondary text-3xl">
                {topic.emoji}
              </span>
              <div>
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
                  {topic.nameVi}
                  <Badge variant={topic.language === "english" ? "default" : "secondary"}>
                    {topic.language === "english" ? "EN" : "中文"}
                  </Badge>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic.wordCount} từ · {topic.estMinutes} phút · Độ khó {topic.difficulty}/5
                </p>
              </div>
            </div>
            <Link
              href={`/learn?topic=${topic.slug}&language=${topic.language}`}
              className={buttonVariants({ size: "lg" })}
            >
              <PlayCircle /> Bắt đầu học
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
          <div className="flex items-center gap-3">
            <Progress value={topic.percent} className="h-2.5 flex-1" />
            <span className="text-sm font-semibold">
              {topic.learnedCount}/{topic.wordCount} đã học
            </span>
          </div>
        </CardContent>
      </Card>

      <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
        {topic.words.map((w) => {
          const lang = w.language as VocabLanguage;
          const uv = w.userVocabulary;
          const status = uv?.status ?? "new";
          return (
            <li key={w.id} className="flex items-center gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">
                {lang === "english" ? "🇬🇧" : "🇨🇳"}
              </span>
              <Link href={`/dictionary/${w.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold hover:text-primary">{w.word}</span>
                  {w.pinyin && lang === "chinese" && (
                    <span className="truncate text-xs text-muted-foreground">{w.pinyin}</span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">{w.meaningVi}</p>
              </Link>
              <span className="hidden shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline">
                {masteryLabel(status)}
              </span>
              {uv?.status === "mastered" && (
                <span title="Đã thành thạo">✅</span>
              )}
              {uv?.status !== "mastered" && (
                <AudioButton text={w.word} language={lang} size="icon-sm" variant="ghost" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}