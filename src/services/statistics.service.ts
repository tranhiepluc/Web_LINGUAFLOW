import { prisma } from "@/lib/db";
import { addDays, startOfDay } from "@/lib/utils";
import type { DashboardStats } from "@/types";

function dateArray(days: number): Date[] {
  const out: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(addDays(startOfDay(), -i));
  }
  return out;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [user, totalLearned, dueToday, savedCount, todayProgress, reviewAgg] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { xp: true, level: true, streak: true, longestStreak: true, goalDaily: true },
    }),
    prisma.userVocabulary.count({ where: { userId, status: { not: "new" } } }),
    prisma.userVocabulary.count({
      where: { userId, nextReviewAt: { not: null, lte: new Date() } },
    }),
    prisma.userVocabulary.count({ where: { userId, isSaved: true } }),
    prisma.dailyProgress.findUnique({
      where: { userId_date: { userId, date: startOfDay() } },
    }),
    prisma.userVocabulary.aggregate({
      where: { userId },
      _sum: { correctCount: true, incorrectCount: true },
      _count: { _all: true },
    }),
  ]);

  const correct = reviewAgg._sum.correctCount ?? 0;
  const incorrect = reviewAgg._sum.incorrectCount ?? 0;
  const total = correct + incorrect;

  return {
    totalLearned,
    dueToday,
    savedCount,
    streak: user.streak,
    longestStreak: user.longestStreak,
    xp: user.xp,
    level: user.level,
    todayLearned: todayProgress?.wordsLearned ?? 0,
    dailyGoal: user.goalDaily,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    totalReviews: total,
  };
}

export interface ActivityPoint {
  date: string;
  label: string;
  learned: number;
  reviewed: number;
  accuracy: number;
}

export async function getWeeklyActivity(userId: string, days = 7): Promise<ActivityPoint[]> {
  const dates = dateArray(days);
  const rows = await prisma.dailyProgress.findMany({
    where: { userId, date: { gte: dates[0] } },
    orderBy: { date: "asc" },
  });

  const map = new Map(rows.map((r) => [r.date.toDateString(), r]));

  return dates.map((d) => {
    const row = map.get(d.toDateString());
    const correct = row?.correctAnswers ?? 0;
    const incorrect = row?.incorrectAnswers ?? 0;
    const total = correct + incorrect;
    return {
      date: d.toISOString(),
      label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      learned: row?.wordsLearned ?? 0,
      reviewed: row?.wordsReviewed ?? 0,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
    };
  });
}

export interface StatisticsOverview {
  totalWordsLearned: number;
  totalReviews: number;
  accuracy: number;
  streak: number;
  longestStreak: number;
  masteredCount: number;
  totalMinutes: number;
  xp: number;
  level: number;
  englishCount: number;
  chineseCount: number;
  mastery: { status: string; count: number }[];
  daily: ActivityPoint[];
  reviewActivity: ActivityPoint[];
  accuracyOverTime: ActivityPoint[];
}

export async function getStatistics(userId: string): Promise<StatisticsOverview> {
  const [user, statusGroups, languageGroups, progressRows, reviewAgg] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { xp: true, level: true, streak: true, longestStreak: true },
    }),
    prisma.userVocabulary.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.userVocabulary.findMany({
      where: { userId },
      select: { vocabulary: { select: { language: true } } },
    }),
    prisma.dailyProgress.findMany({
      where: { userId, date: { gte: addDays(startOfDay(), -13) } },
      orderBy: { date: "asc" },
    }),
    prisma.userVocabulary.aggregate({
      where: { userId },
      _sum: { correctCount: true, incorrectCount: true },
    }),
  ]);

  const correct = reviewAgg._sum.correctCount ?? 0;
  const incorrect = reviewAgg._sum.incorrectCount ?? 0;
  const total = correct + incorrect;

  const daily = await getWeeklyActivity(userId, 14);

  const masteryOrder = ["new", "learning", "review", "mastered"];
  const masteryMap = new Map(statusGroups.map((g) => [g.status, g._count]));
  const mastery = masteryOrder.map((status) => ({
    status,
    count: masteryMap.get(status) ?? 0,
  }));

  return {
    totalWordsLearned: languageGroups.length,
    totalReviews: total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    streak: user.streak,
    longestStreak: user.longestStreak,
    masteredCount: masteryMap.get("mastered") ?? 0,
    totalMinutes: progressRows.reduce((s, r) => s + r.minutesLearned, 0) + 180,
    xp: user.xp,
    level: user.level,
    englishCount: languageGroups.filter((g) => g.vocabulary.language === "english").length,
    chineseCount: languageGroups.filter((g) => g.vocabulary.language === "chinese").length,
    mastery,
    daily,
    reviewActivity: daily,
    accuracyOverTime: daily,
  };
}
