import { prisma } from "@/lib/db";
import { requireUser } from "@/services/auth.service";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Achievement } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thành tích · LINGUAFLOW" };

const CATEGORY_LABELS: Record<string, string> = {
  general: "Khởi đầu",
  learning: "Học tập",
  streak: "Kiên trì",
  mastery: "Thành thạo",
};

export default async function AchievementsPage() {
  const user = await requireUser();

  const [all, unlockedRows] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: user.id }, select: { achievementId: true } }),
  ]);

  const unlocked = new Set(unlockedRows.map((r) => r.achievementId));
  const unlockedCount = all.filter((a) => unlocked.has(a.id)).length;
  const percent = all.length ? Math.round((unlockedCount / all.length) * 100) : 0;

  const groups = new Map<string, Achievement[]>();
  for (const a of all) {
    const key = CATEGORY_LABELS[a.category] ?? a.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">🏆 Thành tích</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mở khóa huy hiệu khi bạn đạt các cột mốc học tập.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Đã mở khóa <b className="text-primary">{unlockedCount}</b>/{all.length} huy hiệu
            </p>
            <p className="text-xs text-muted-foreground">
              {all.length - unlockedCount > 0
                ? `Còn ${all.length - unlockedCount} huy hiệu đang chờ bạn chinh phục.`
                : "Bạn đã sở hữu toàn bộ huy hiệu! 🎉"}
            </p>
          </div>
          <div className="w-full max-w-xs space-y-1.5">
            <Progress value={percent} className="h-3" />
            <p className="text-right text-xs font-semibold">{percent}%</p>
          </div>
        </CardContent>
      </Card>

      {[...groups.entries()].map(([name, list]) => (
        <section key={name} className="space-y-3">
          <h2 className="font-semibold">{name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => {
              const isUnlocked = unlocked.has(a.id);
              return (
                <Card key={a.id} className={isUnlocked ? "card-hover" : "opacity-70"}>
                  <CardContent className="flex items-start gap-3">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${isUnlocked ? "bg-secondary" : "bg-secondary/60 grayscale"}`}>
                      {a.icon}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold leading-tight">{a.titleVi}</h3>
                        <Badge variant="secondary" className={isUnlocked ? "bg-emerald-500/15 text-emerald-600" : ""}>
                          {isUnlocked ? "Đã mở" : "Chưa mở"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      <p className="text-xs font-semibold text-primary">+{a.xpReward} XP</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}