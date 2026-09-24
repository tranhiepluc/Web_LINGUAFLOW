import { prisma } from "@/lib/db";
import { levelFromXp } from "@/lib/gamification";
import { startOfDay, isSameDay, addDays } from "@/lib/utils";
import { evaluateAchievements } from "./achievements.service";

export interface DailyResult {
  todayLearned: number;
  todayReviewed: number;
  dailyGoal: number;
  goalAchieved: boolean;
  wordsRemaining: number;
}

/** Cộng XP + cập nhật level. Trả về level mới nếu lên hạng. */
export async function addXp(userId: string, amount: number): Promise<{ leveledUp: boolean; level: number; xp: number }> {
  if (amount <= 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
    return { leveledUp: false, level: user?.level ?? 1, xp: user?.xp ?? 0 };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true, level: true } });
  const newXp = user.xp + amount;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > user.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  });

  return { leveledUp, level: newLevel, xp: newXp };
}

export interface ActivityInput {
  wordsLearned?: number;
  wordsReviewed?: number;
  correct?: number;
  incorrect?: number;
  minutes?: number;
  xp?: number;
}

/**
 * Ghi nhận hoạt động học trong ngày:
 * - cộng dồn DailyProgress
 * - cập nhật streak (duy trì khi đạt goal)
 * - cộng XP
 * - đánh giá thành tích
 */
export async function recordActivity(userId: string, input: ActivityInput): Promise<DailyResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, longestStreak: true, lastActiveDate: true, goalDaily: true, xp: true, level: true },
  });

  const today = startOfDay();

  const before = await prisma.dailyProgress.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });

  const wordsLearnedDelta = input.wordsLearned ?? 0;
  const wordsReviewedDelta = input.wordsReviewed ?? 0;

  const updated = await prisma.dailyProgress.update({
    where: { id: before.id },
    data: {
      wordsLearned: { increment: wordsLearnedDelta },
      wordsReviewed: { increment: wordsReviewedDelta },
      correctAnswers: { increment: input.correct ?? 0 },
      incorrectAnswers: { increment: input.incorrect ?? 0 },
      xpEarned: { increment: input.xp ?? 0 },
      minutesLearned: { increment: input.minutes ?? 0 },
    },
  });

  const goal = user.goalDaily;
  const todayTotal = updated.wordsLearned;
  const goalAchieved = todayTotal >= goal;

  if (goalAchieved && !updated.goalAchieved) {
    await prisma.dailyProgress.update({ where: { id: before.id }, data: { goalAchieved: true } });
  }

  // --- Streak ---
  let streak = user.streak;
  const last = user.lastActiveDate;
  const shouldUpdateStreak = goalAchieved || wordsReviewedDelta > 0 || wordsLearnedDelta > 0;

  if (shouldUpdateStreak) {
    if (!last) {
      streak = 1;
    } else if (isSameDay(last, today)) {
      // đã ghi nhận hôm nay
    } else if (isSameDay(last, addDays(today, -1))) {
      streak += 1;
    } else {
      streak = 1;
    }

    const longestStreak = Math.max(user.longestStreak, streak);
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveDate: new Date(), streak, longestStreak },
    });
  }

  if ((input.xp ?? 0) > 0) {
    await addXp(userId, input.xp ?? 0);
  }

  const unlocked = await evaluateAchievements(userId);

  // Thêm XP thưởng thành tích
  const bonusXp = unlocked.reduce((sum, a) => sum + a.xpReward, 0);
  if (bonusXp > 0) {
    const current = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true, level: true } });
    const newXp = current.xp + bonusXp;
    const newLevel = levelFromXp(newXp);
    await prisma.user.update({ where: { id: userId }, data: { xp: newXp, level: newLevel } });
  }

  return {
    todayLearned: updated.wordsLearned,
    todayReviewed: updated.wordsReviewed,
    dailyGoal: goal,
    goalAchieved: goalAchieved || updated.goalAchieved,
    wordsRemaining: Math.max(0, goal - updated.wordsLearned),
  };
}
