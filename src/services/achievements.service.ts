import { prisma } from "@/lib/db";
import type { Achievement } from "@prisma/client";

/** Đánh giá và mở khóa thành tích cho user. Trả về danh sách vừa mở khóa. */
export async function evaluateAchievements(userId: string): Promise<Achievement[]> {
  const [all, unlocked, stats] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        streak: true,
        longestStreak: true,
        onboarded: true,
        profile: { select: { englishLevel: true, chineseLevel: true } },
        _count: {
          select: {
            userVocabularies: true,
            reviewRecords: { where: { result: { in: ["good", "easy", "correct"] } } },
          },
        },
        userVocabularies: { select: { status: true, vocabulary: { select: { language: true } } } },
      },
    }),
    prisma.quiz.findFirst({
      where: { userId, totalQuestions: { gte: 1 } },
      orderBy: { score: "desc" },
    }),
  ]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const totalWords = stats._count.userVocabularies;
  const streak = Math.max(stats.streak, stats.longestStreak);
  const mastered = stats.userVocabularies.filter((uv) => uv.status === "mastered").length;
  const englishWords = stats.userVocabularies.filter((uv) => uv.vocabulary.language === "english").length;
  const reviewCount = stats._count.reviewRecords;
  const perfectQuiz = (await prisma.quiz.count({ where: { userId, score: { gt: 0 } } })) > 0;
  const hasPerfect = perfectQuiz
    ? await prisma.quiz.findFirst({ where: { userId, score: 100 } })
    : null;

  // Chủ đề HSK 1 hoàn thành
  const hsk1Topic = await prisma.topic.findUnique({
    where: { slug: "hsk-1" },
    select: { _count: { select: { vocabularies: true } } },
  });
  const hsk1Total = hsk1Topic?._count.vocabularies ?? 0;
  const hsk1Learned = hsk1Total
    ? await prisma.userVocabulary.count({
        where: {
          userId,
          status: { in: ["learning", "review", "mastered"] },
          vocabulary: { topics: { some: { topic: { slug: "hsk-1" } } } },
        },
      })
    : 0;

  const predicates: Record<string, boolean> = {
    "first-word": totalWords >= 1,
    "words-100": totalWords >= 100,
    "words-500": totalWords >= 500,
    "words-1000": totalWords >= 1000,
    "streak-7": streak >= 7,
    "streak-30": streak >= 30,
    "quiz-perfect": Boolean(hasPerfect),
    "review-50": reviewCount >= 50,
    "hsk1-complete": hsk1Total > 0 && hsk1Learned >= hsk1Total,
    "english-starter": englishWords >= 30,
    "master-10": mastered >= 10,
    "daily-goal-1": (await prisma.dailyProgress.count({ where: { userId, goalAchieved: true } })) >= 1,
  };

  const newlyUnlocked: Achievement[] = [];
  for (const achievement of all) {
    if (unlockedIds.has(achievement.id)) continue;
    if (!predicates[achievement.code]) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
    newlyUnlocked.push(achievement);
  }

  return newlyUnlocked;
}

export async function getUnlockedAchievementIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  return new Set(rows.map((r) => r.achievementId));
}
