import { Award, BarChart3, Clock, Flame, Gauge, Target, Trophy } from "lucide-react";

import { getStatistics } from "@/services/statistics.service";
import { requireUser } from "@/services/auth.service";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  WeeklyActivityChart,
  AccuracyChart,
} from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { masteryLabel } from "@/lib/spaced-repetition";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thống kê học tập · LINGUAFLOW" };

const MASTERY_ORDER = ["new", "learning", "review", "mastered"] as const;
const MASTERY_COLORS: Record<string, string> = {
  new: "bg-slate-400",
  learning: "bg-sky-500",
  review: "bg-amber-500",
  mastered: "bg-emerald-500",
};

export default async function StatisticsPage() {
  const user = await requireUser();
  const stats = await getStatistics(user.id);

  const total = stats.totalWordsLearned || 1;
  const mastered = stats.mastery.find((m) => m.status === "mastered")?.count ?? 0;
  const masteredPct = Math.round((mastered / total) * 100);
  const xp = levelProgress(stats.xp);
  const xpPct = xp.percent;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <BarChart3 className="size-8 text-primary" /> Thống kê học tập
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bức tranh toàn cảnh hành trình ghi nhớ từ vựng của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Từ đã học"
          value={formatNumber(stats.totalWordsLearned)}
          hint={`${stats.englishCount} EN · ${stats.chineseCount} 中文`}
        />
        <StatCard
          icon={Gauge}
          label="Độ chính xác"
          value={`${stats.accuracy}%`}
          hint="khi ôn tập"
          tone="success"
        />
        <StatCard
          icon={Flame}
          label="Chuỗi ngày"
          value={`${stats.streak} ngày`}
          hint={`Kỷ lục: ${stats.longestStreak}`}
          tone="warning"
        />
        <StatCard
          icon={Clock}
          label="Tổng thời gian"
          value={`${Math.round(stats.totalMinutes / 60)}h`}
          hint={`${formatNumber(stats.totalReviews)} lượt ôn`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" /> Từ vựng mỗi ngày · 7 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChart data={stats.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" /> Hiệu quả ôn tập · 7 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccuracyChart data={stats.reviewActivity} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4 text-primary" />
            Cấp {xp.level} · {levelTitle(xp.level)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kinh nghiệm (XP)</span>
            <span className="font-medium">
              {formatNumber(stats.xp)} · {xpPct}% lên cấp {xp.level + 1}
            </span>
          </div>
          <Progress value={xpPct} className="h-2" />

          <div className="grid gap-3 pt-1">
            {MASTERY_ORDER.map((status) => {
              const row = stats.mastery.find((m) => m.status === status);
              const count = row?.count ?? 0;
              const percent = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{masteryLabel(status)}</span>
                    <span className="text-muted-foreground">{formatNumber(count)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={percent} className={`h-2 flex-1 ${MASTERY_COLORS[status]}`} />
                    <span className="w-9 text-right text-xs text-muted-foreground">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="size-4 text-primary" /> Đã thành thạo
            </span>
            <span className="font-semibold text-emerald-600">{masteredPct}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
