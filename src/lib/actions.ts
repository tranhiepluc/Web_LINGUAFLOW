"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUserId, completeOnboarding, createUserWithProfile } from "@/services/auth.service";
import {
  saveVocabulary,
  bulkSaveVocabulary,
  removeUserVocabulary,
  searchVocabulary,
  countDueToday,
} from "@/services/vocabulary.service";
import { submitReviews } from "@/services/review.service";
import { savePracticeResult } from "@/services/practice.service";
import { evaluateAchievements } from "@/services/achievements.service";
import {
  onboardingSchema,
  settingsSchema,
  aiAnalyzeSchema,
  registerSchema,
  type OnboardingInput,
  type SettingsInput,
  type RegisterInput,
} from "@/lib/validations";
import { scheduleReview, initialSRSState } from "@/lib/spaced-repetition";
import { XP } from "@/lib/gamification";
import { recordActivity } from "@/services/gamification.service";
import { PRACTICE_TYPES, generatePractice } from "@/services/practice.service";
import type { NotificationItem, PracticeType, ReviewAnswer, VocabLanguage } from "@/types";

// ---------------- AUTH ----------------

export async function registerAction(input: RegisterInput) {
  const parsed = registerSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("EMAIL_EXISTS");

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await createUserWithProfile({
    name: parsed.name.trim(),
    email,
    passwordHash,
    language: parsed.language,
    goalDaily: parsed.goalDaily,
  });

  return { ok: true, email, password: parsed.password };
}

// ---------------- ONBOARDING ----------------

export async function completeOnboardingAction(input: OnboardingInput) {
  const userId = await requireUserId();
  const parsed = onboardingSchema.parse(input);
  const user = await completeOnboarding(userId, parsed);
  await evaluateAchievements(userId);
  revalidatePath("/", "layout");
  return { ok: true, onboarded: user.onboarded };
}

// ---------------- SETTINGS ----------------

export async function updateSettingsAction(input: SettingsInput) {
  const userId = await requireUserId();
  const parsed = settingsSchema.parse(input);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { name: parsed.name, language: parsed.language, goalDaily: parsed.dailyGoal },
    }),
    prisma.userSettings.upsert({
      where: { userId },
      update: {
        theme: parsed.theme,
        dailyGoal: parsed.dailyGoal,
        language: parsed.language,
        englishLevel: parsed.englishLevel ?? null,
        chineseLevel: parsed.chineseLevel ?? null,
        soundEnabled: parsed.soundEnabled,
        ttsRate: parsed.ttsRate,
        notifyReviews: parsed.notifyReviews,
        notifyStreak: parsed.notifyStreak,
        notifyAchievements: parsed.notifyAchievements,
      },
      create: {
        userId,
        theme: parsed.theme,
        dailyGoal: parsed.dailyGoal,
        language: parsed.language,
      },
    }),
    prisma.profile.upsert({
      where: { userId },
      update: { englishLevel: parsed.englishLevel ?? null, chineseLevel: parsed.chineseLevel ?? null },
      create: { userId, nativeLanguage: "vi" },
    }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLanguagePrefAction(language: VocabLanguage | "both") {
  const userId = await requireUserId();
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { language } }),
    prisma.userSettings.upsert({
      where: { userId },
      update: { language },
      create: { userId, language },
    }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, language };
}

// ---------------- VOCABULARY ----------------

export async function saveVocabularyAction(vocabularyId: string) {
  const userId = await requireUserId();
  if (!vocabularyId.trim()) throw new Error("VALIDATION");

  const vocab = await prisma.vocabulary.findUnique({ where: { id: vocabularyId } });
  if (!vocab) throw new Error("NOT_FOUND");

  const { created } = await saveVocabulary(userId, vocabularyId);
  revalidatePath("/dictionary");
  revalidatePath("/vocabulary");
  revalidatePath("/topics", "layout");
  return { ok: true, created };
}

export async function bulkSaveVocabularyAction(vocabularyIds: string[]) {
  const userId = await requireUserId();
  if (!Array.isArray(vocabularyIds) || vocabularyIds.length === 0 || vocabularyIds.length > 200) {
    throw new Error("VALIDATION");
  }
  const { created, total } = await bulkSaveVocabulary(userId, vocabularyIds);
  revalidatePath("/vocabulary");
  revalidatePath("/ai-import");
  return { ok: true, created, total };
}

export async function removeUserVocabularyAction(userVocabId: string) {
  const userId = await requireUserId();
  await removeUserVocabulary(userId, userVocabId);
  revalidatePath("/vocabulary");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function searchVocabularyAction(q: string, language: VocabLanguage | "all" = "all") {
  if (!q.trim()) return [];
  return searchVocabulary(q, { language, take: 8 });
}

// ---------------- LEARN ----------------

export interface LearnCardAnswer {
  vocabularyId: string;
  grade: "again" | "good";
}

export async function completeLearnSessionAction(answers: LearnCardAnswer[]) {
  const userId = await requireUserId();
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error("VALIDATION: chưa có từ đã học");
  }

  const results = await Promise.all(
    answers.map(async (a) => {
      const vocab = await prisma.vocabulary.findUnique({ where: { id: a.vocabularyId } });
      if (!vocab) return null;

      let uv = await prisma.userVocabulary.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: vocab.id } },
      });

      if (!uv) {
        const srs = scheduleReview(initialSRSState(), a.grade);
        uv = await prisma.userVocabulary.create({
          data: {
            userId,
            vocabularyId: vocab.id,
            status: srs.status,
            easeFactor: srs.easeFactor,
            interval: srs.interval,
            repetitionCount: srs.repetitionCount,
            masteryLevel: srs.masteryLevel,
            nextReviewAt: srs.nextReviewAt,
            isSaved: true,
            correctCount: a.grade === "good" ? 1 : 0,
            incorrectCount: a.grade === "again" ? 1 : 0,
          },
        });
      } else {
        const srs = scheduleReview(
          {
            easeFactor: uv.easeFactor,
            interval: uv.interval,
            repetitionCount: uv.repetitionCount,
            masteryLevel: uv.masteryLevel,
          },
          a.grade,
        );
        uv = await prisma.userVocabulary.update({
          where: { id: uv.id },
          data: {
            status: srs.status,
            easeFactor: srs.easeFactor,
            interval: srs.interval,
            repetitionCount: srs.repetitionCount,
            masteryLevel: srs.masteryLevel,
            nextReviewAt: srs.nextReviewAt,
            lastReviewedAt: new Date(),
            correctCount: { increment: a.grade === "good" ? 1 : 0 },
            incorrectCount: { increment: a.grade === "again" ? 1 : 0 },
          },
        });
      }

      return { vocabularyId: vocab.id, status: uv.status, nextReviewAt: uv.nextReviewAt };
    }),
  );

  const learned = results.filter(Boolean) as { vocabularyId: string; status: string; nextReviewAt: Date }[];
  const xpEarned = learned.length * XP.WORD_LEARNED;

  const activity = await recordActivity(userId, {
    wordsLearned: learned.length,
    xp: xpEarned,
    minutes: Math.max(1, Math.round(learned.length / 5)),
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true },
  });

  return {
    results: learned,
    total: learned.length,
    xpEarned,
    streak: user.streak,
    goalAchieved: activity.goalAchieved,
    todayLearned: activity.todayLearned,
    dailyGoal: activity.dailyGoal,
  };
}

// ---------------- REVIEW ------------------

export async function submitReviewsAction(submissions: ReviewAnswer[]) {
  const userId = await requireUserId();
  const mapped = submissions.map((s) => ({
    userVocabId: s.userVocabId,
    grade: s.grade,
    responseMs: s.responseMs,
  }));
  const outcome = await submitReviews(userId, mapped);
  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/vocabulary");
  return outcome;
}

// ---------------- PRACTICE ----------------

// ---------------- PRACTICE ----------------

export async function generatePracticeAction(type: PracticeType, language: VocabLanguage) {
  const userId = await requireUserId();
  const isValidType = PRACTICE_TYPES.some((t) => t.type === type);
  if (!isValidType || !["english", "chinese"].includes(language)) {
    throw new Error("VALIDATION: loại bài tập hoặc ngôn ngữ không hợp lệ");
  }
  return generatePractice(userId, { type, language, count: 8 });
}

export async function savePracticeAction(payload: {
  type: string;
  language: VocabLanguage;
  answers: { questionId: string; userAnswer: string; correctAnswer: string }[];
}) {
  const userId = await requireUserId();
  const outcome = await savePracticeResult(userId, payload as Parameters<typeof savePracticeResult>[1]);
  revalidatePath("/dashboard");
  revalidatePath("/practice");
  return outcome;
}

// ---------------- NOTIFICATIONS ----------------

export async function getNotificationsAction(): Promise<NotificationItem[]> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, xp: true, level: true, lastActiveDate: true },
  });
  const [due, todayProgress] = await Promise.all([
    countDueToday(userId),
    prisma.dailyProgress.findUnique({
      where: { userId_date: { userId, date: new Date() } },
    }),
  ]);

  const items: NotificationItem[] = [];

  if (due > 0) {
    items.push({
      id: "n-review",
      type: "review",
      title: "Cần ôn tập hôm nay",
      body: `Bạn có ${due} từ cần ôn hôm nay. Ôn sớm để ghi nhớ lâu hơn nhé!`,
      icon: "🧠",
    });
  }

  if (user.streak === 7 || user.streak === 30) {
    items.push({
      id: "n-streak",
      type: "streak",
      title: `Đã giữ streak ${user.streak} ngày!`,
      body: "Thật ấn tượng, hãy tiếp tục duy trì nhé! 🔥",
      icon: "🔥",
    });
  }

  if (user.level >= 5) {
    items.push({
      id: "n-level",
      type: "level",
      title: `Bạn đang ở Level ${user.level}`,
      body: "Tiếp tục học mỗi ngày để nâng cấp trình độ!",
      icon: "🏆",
    });
  }

  if (todayProgress?.goalAchieved) {
    items.push({
      id: "n-goal",
      type: "goal",
      title: "Hoàn thành mục tiêu hôm nay 🎯",
      body: "Tuyệt vời! Hãy thư giãn và ôn lại nếu cần.",
      icon: "🎉",
    });
  }

  return items;
}

// ---------------- AI (validate lại an toàn) ----------------

export async function validateAiText(text: string) {
  const parsed = aiAnalyzeSchema.safeParse(text);
  return { ok: parsed.success, message: parsed.success ? undefined : parsed.error.errors[0]?.message };
}