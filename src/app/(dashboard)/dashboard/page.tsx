import Link from "next/link";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Brain,
  Check,
  Dumbbell,
  Flame,
  Library,
  PlayCircle,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";

import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyActivityChart } from "@/components/dashboard/dashboard-charts";
import { AudioButton } from "@/components/shared/audio-button";
import { getDashboardStats, getWeeklyActivity } from "@/services/statistics.service";
import { getMyVocabularies } from "@/services/vocabulary.service";
import { requireUser } from "@/services/auth.service";
import { masteryLabel } from "@/lib/spaced-repetition";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VocabLanguage } from "@/types";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, weekly] = await Promise.all([
    getDashboardStats(user.id),
    getWeeklyActivity(user.id, 7),
  ]);

  const recent = await getMyVocabularies(user.id, { page: 1, pageSize: 5 });
  const progress = levelProgress(stats.xp);
  const goalPercent = Math.min(100, Math.round((stats.todayLearned / Math.max(1, stats.dailyGoal)) * 100));

  return (
    <div className="space-y-6">
      <GreetingHeader name={user.name} streak={stats.streak} language={user.language} />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Mục tiêu hôm nay */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  <h2 className="font-semibold">Mục tiêu hôm nay</h2>
                </div>
                <span className="text-sm font-semibold">
                  {stats.todayLearned}/{stats.dailyGoal} từ
                </span>
              </div>
              <Progress value={goalPercent} />
              {goalPercent >= 100 ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <Check className="size-4" /> Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay 🎉
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Còn {Math.max(0, stats.dailyGoal - stats.todayLearned)} từ nữa là hoàn thành mục tiêu.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hành động nhanh */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction
              href="/learn"
              icon={BookOpen}
              label="Học từ vựng"
              tone="text-primary bg-primary/10"
            />
            <QuickAction
              href="/review"
              icon={Brain}
              label="Ôn tập"
              badge={stats.dueToday > 0 ? `🔥 ${stats.dueToday}` : undefined}
              tone={stats.dueToday > 0 ? "text-destructive bg-destructive/10" : "text-success bg-success/10"}
            />
            <QuickAction href="/practice" icon={Dumbbell} label="Luyện tập" tone="text-amber-600 bg-amber-500/10" />
            <QuickAction href="/dictionary" icon={Search} label="Tra từ" tone="text-sky-600 bg-sky-500/10" />
          </div>

          {/* Cần ôn hôm nay */}
          {stats.dueToday > 0 ? (
            <Card className="gradient-card relative overflow-hidden">
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Flame className="size-5 text-warning" />
                    {stats.dueToday} từ cần ôn tập hôm nay
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Khối lượng nhỏ nhưng giúp bạn nhớ {masteryLabel("learning").toLowerCase()} — ôn đều mỗi ngày là chìa khóa!
                  </p>
                </div>
                <Link href="/review" className={buttonVariants({ size: "lg" })}>
                    <PlayCircle className="size-5" /> Ôn tập ngay
                  </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 font-semibold text-success">
                    <Check className="size-5" /> Hết việc ôn tập hôm nay
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nghỉ ngơi một chút hoặc học thêm từ mới nhé.
                  </p>
                </div>
                <Link href="/learn" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Học từ mới
                  </Link>
              </CardContent>
            </Card>
          )}

          {/* Hoạt động 7 ngày */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  <h2 className="font-semibold">Hoạt động 7 ngày qua</h2>
                </div>
                <Link href="/statistics" className="text-sm font-medium text-primary hover:underline">
                  Xem chi tiết →
                </Link>
              </div>
              <WeeklyActivityChart data={weekly} />
            </CardContent>
          </Card>

          {/* Từ vựng gần đây */}
          <Card>
            <CardContent className="space-y-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="size-5 text-primary" />
                  <h2 className="font-semibold">Từ vựng của bạn</h2>
                </div>
                <Link href="/vocabulary" className="text-sm font-medium text-primary hover:underline">
                  Xem tất cả →
                </Link>
              </div>
              {recent.items.length === 0 ? (
                <p className="rounded-2xl bg-secondary/50 p-4 text-center text-sm text-muted-foreground">
                  Bạn chưa lưu từ nào.{" "}
                  <Link href="/dictionary" className="font-semibold text-primary hover:underline">
                    Tra từ đầu tiên ngay!
                  </Link>
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">
                        {item.vocabulary.language === "english" ? "🇬🇧" : "🇨🇳"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dictionary/${item.vocabulary.id}`}
                            className="truncate font-semibold hover:text-primary"
                          >
                            {item.vocabulary.word}
                          </Link>
                          <Badge variant={item.vocabulary.language === "english" ? "default" : "secondary"} className="text-[10px]">
                            {item.vocabulary.language === "english" ? "EN" : "中文"}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{item.vocabulary.meaningVi}</p>
                      </div>
                      <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline">
                        {masteryLabel(item.status)}
                      </span>
                      <AudioButton
                        text={item.vocabulary.word}
                        language={item.vocabulary.language as VocabLanguage}
                        size="icon-sm"
                        variant="ghost"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phải */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold">
                  <BarChart3 className="size-5 text-primary" /> Hành trình của bạn
                </h2>
                <Link href="/statistics" className="text-sm font-medium text-primary hover:underline">
                  Chi tiết
                </Link>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Cấp {progress.level} · {levelTitle(progress.level)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.xp} XP · Còn {progress.xpToNext} XP lên cấp {progress.level + 1}
                </p>
              </div>
              <Progress value={progress.percent} className="h-2.5" />
              <div className="grid grid-cols-2 gap-2">
                <MiniStat icon={Flame} label="Streak hiện tại" value={stats.streak} tone="warning" />
                <MiniStat icon={BookMarked} label="Đã lưu" value={stats.savedCount} tone="default" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
            <StatCard icon={BookOpen} label="Từ đã học" value={stats.totalLearned} tone="default" />
            <StatCard icon={Brain} label="Cần ôn hôm nay" value={stats.dueToday} tone={stats.dueToday > 0 ? "danger" : "success"} />
            <StatCard icon={BookMarked} label="Từ đã lưu" value={stats.savedCount} tone="warning" />
            <StatCard icon={TrendingUp} label="Độ chính xác" value={`${stats.accuracy}%`} tone="success" />
          </div>

          <Card>
            <CardContent className="space-y-2">
              <h2 className="font-semibold">Mẹo học hiệu quả 💡</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Học từ mới vào buổi sáng, ôn tập vào buổi tối. Chỉ cần <b>10 phút/ngày</b>, giữ streak
                liên tục — khối từ vựng của bạn sẽ tăng lên rõ rệt sau 2 tuần.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
  badge,
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
  tone: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-2 rounded-3xl border border-border bg-card px-3 py-5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {badge && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-600">
          {badge}
        </span>
      )}
      <span className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="size-5" />
      </span>
      {label}
    </Link>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  tone: "default" | "warning" | "success" | "danger";
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/50 p-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}