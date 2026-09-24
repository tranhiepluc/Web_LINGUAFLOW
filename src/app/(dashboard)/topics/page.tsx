import Link from "next/link";
import { Layers } from "lucide-react";

import { getTopics } from "@/services/topics.service";
import { requireUser } from "@/services/auth.service";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface TopicsPageProps {
  searchParams: Promise<{ language?: string }>;
}

export const metadata = { title: "Chủ đề học tập · LINGUAFLOW" };

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const language = (params.language ?? "all") as "english" | "chinese" | "all";

  const topics = await getTopics(user.id, language);

  const filters = [
    { value: "all", label: "🌎 Tất cả" },
    { value: "english", label: "🇬🇧 Tiếng Anh" },
    { value: "chinese", label: "🇨🇳 Tiếng Trung" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Layers className="size-7 text-primary" /> Chủ đề học tập
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            20 chủ đề theo ngữ cảnh thực tế giúp học từ dễ nhớ và dễ vận dụng hơn.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/topics" : `/topics?language=${f.value}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              language === f.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {topics.length === 0 ? (
        <EmptyState icon="search" title="Chưa có chủ đề nào" description="Hãy chọn bộ lọc khác để xem." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Card key={t.id} className="card-hover overflow-hidden">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-2xl">
                      {t.emoji}
                    </span>
                    <div>
                      <h2 className="font-semibold leading-tight">{t.nameVi}</h2>
                      <p className="text-xs text-muted-foreground">
                        {t.wordCount} từ · {t.estMinutes} phút
                      </p>
                    </div>
                  </div>
                  <Badge variant={t.language === "english" ? "default" : "secondary"}>
                    {t.language === "english" ? "EN" : "中文"}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      Đã học {t.learnedCount}/{t.wordCount}
                    </span>
                    <span>{t.percent}%</span>
                  </div>
                  <Progress value={t.percent} className="h-2" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/learn?topic=${t.slug}&language=${t.language}`}
                    className={buttonVariants({ size: "sm", className: "flex-1" })}
                  >
                    Học chủ đề này
                  </Link>
                  <Link
                    href={`/topics/${t.slug}`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    Danh sách từ
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}