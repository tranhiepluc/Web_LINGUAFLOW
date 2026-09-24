import { prisma } from "@/lib/db";
import {
  scheduleReview,
  reviewPriority,
  estimateReviewTime,
  type ReviewGrade,
} from "@/lib/spaced-repetition";
import { recordActivity } from "./gamification.service";
import type { VocabLanguage } from "@/types";

export interface ReviewSummary {
  dueCount: number;
  overdueCount: number;
  dueTodayCount: number;
  weakCount: number;
  streak: number;
  accuracy: number;
  totalReviews: number;
  estimatedTime: string;
}

export async function getReviewSummary(userId: string): Promise<ReviewSummary> {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [user, dueCount, overdueCount, dueTodayCount, weakCount, progressAgg] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { streak: true, longestStreak: true },
    }),
    prisma.userVocabulary.count({
      where: { userId, nextReviewAt: { not: null, lte: now } },
    }),
    prisma.userVocabulary.count({
      where: { userId, nextReviewAt: { not: null, lt: startOfToday } },
    }),
    prisma.userVocabulary.count({
      where: { userId, nextReviewAt: { gte: startOfToday, lte: now } },
    }),
    prisma.userVocabulary.count({
      where: { userId, status: { in: ["learning", "review"] }, masteryLevel: { lte: 2 } },
    }),
    prisma.dailyProgress.aggregate({
      where: { userId },
      _sum: { correctAnswers: true, incorrectAnswers: true },
    }),
  ]);

  const correct = progressAgg._sum.correctAnswers ?? 0;
  const incorrect = progressAgg._sum.incorrectAnswers ?? 0;
  const total = correct + incorrect;

  return {
    dueCount,
    overdueCount,
    dueTodayCount,
    weakCount,
    streak: user.streak,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    totalReviews: total,
    estimatedTime: estimateReviewTime(dueCount),
  };
}

export interface ReviewQueueItem {
  userVocabId: string;
  vocabularyId: string;
  language: VocabLanguage;
  word: string;
  pronunciation: string | null;
  pinyin: string | null;
  traditional: string | null;
  meaningVi: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  charAnalysis: string | null;
  masteryLevel: number;
  easeFactor: number;
  interval: number;
  repetitionCount: number;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  status: string;
}

export async function getReviewQueue(
  userId: string,
  options: { language?: VocabLanguage | "all"; limit?: number } = {},
): Promise<ReviewQueueItem[]> {
  const { language = "all", limit = 30 } = options;
  const now = new Date();

  const due = await prisma.userVocabulary.findMany({
    where: {
      userId,
      nextReviewAt: { not: null, lte: now },
      ...(language !== "all" ? { vocabulary: { language } } : {}),
    },
    include: { vocabulary: true },
    take: 500,
  });

  const dueSorted = due
    .sort((a, b) =>
      reviewPriority({
        nextReviewAt: a.nextReviewAt,
        masteryLevel: a.masteryLevel,
        incorrectCount: a.incorrectCount,
        lastReviewedAt: a.lastReviewedAt,
      }) -
      reviewPriority({
        nextReviewAt: b.nextReviewAt,
        masteryLevel: b.masteryLevel,
        incorrectCount: b.incorrectCount,
        lastReviewedAt: b.lastReviewedAt,
      }),
    )
    .slice(0, limit);

  return dueSorted.map((uv) => ({
    userVocabId: uv.id,
    vocabularyId: uv.vocabularyId,
    language: uv.vocabulary.language as VocabLanguage,
    word: uv.vocabulary.word,
    pronunciation: uv.vocabulary.pronunciation,
    pinyin: uv.vocabulary.pinyin,
    traditional: uv.vocabulary.traditional,
    meaningVi: uv.vocabulary.meaningVi,
    partOfSpeech: uv.vocabulary.partOfSpeech,
    exampleSentence: uv.vocabulary.exampleSentence,
    exampleTranslation: uv.vocabulary.exampleTranslation,
    charAnalysis: uv.vocabulary.charAnalysis,
    masteryLevel: uv.masteryLevel,
    easeFactor: uv.easeFactor,
    interval: uv.interval,
    repetitionCount: uv.repetitionCount,
    correctCount: uv.correctCount,
    incorrectCount: uv.incorrectCount,
    nextReviewAt: uv.nextReviewAt,
    lastReviewedAt: uv.lastReviewedAt,
    status: uv.status,
  }));
}

export interface ReviewSubmission {
  userVocabId: string;
  grade: ReviewGrade;
  responseMs?: number;
}

export interface ReviewResult {
  userVocabId: string;
  grade: ReviewGrade;
  correct: boolean;
  nextReviewAt: Date;
  status: string;
  masteryLevel: number;
}

export interface ReviewSubmitOutcome {
  results: ReviewResult[];
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  xpEarned: number;
  newStreak: number;
  goalAchieved: boolean;
  todayLearned: number;
  dailyGoal: number;
}

export async function submitReviews(userId: string, submissions: ReviewSubmission[]): Promise<ReviewSubmitOutcome> {
  if (!submissions.length) {
    throw new Error("VALIDATION: không có câu trả lời nào");
  }

  const session = await prisma.reviewSession.create({
    data: { userId, mode: "review" },
  });

  const results: ReviewResult[] = [];
  let correct = 0;
  let incorrect = 0;

  for (const sub of submissions) {
    const uv = await prisma.userVocabulary.findFirst({
      where: { id: sub.userVocabId, userId },
      include: { vocabulary: true },
    });
    if (!uv) continue;

    const isCorrect = sub.grade === "good" || sub.grade === "easy";
    if (isCorrect) correct += 1;
    else incorrect += 1;

    const srs = scheduleReview(
      {
        easeFactor: uv.easeFactor,
        interval: uv.interval,
        repetitionCount: uv.repetitionCount,
        masteryLevel: uv.masteryLevel,
      },
      sub.grade,
    );

    const updated = await prisma.userVocabulary.update({
      where: { id: uv.id },
      data: {
        easeFactor: srs.easeFactor,
        interval: srs.interval,
        repetitionCount: srs.repetitionCount,
        masteryLevel: srs.masteryLevel,
        nextReviewAt: srs.nextReviewAt,
        lastReviewedAt: new Date(),
        status: srs.status,
        correctCount: { increment: isCorrect ? 1 : 0 },
        incorrectCount: { increment: isCorrect ? 0 : 1 },
      },
    });

    await prisma.reviewRecord.create({
      data: {
        userId,
        userVocabularyId: uv.id,
        vocabularyId: uv.vocabularyId,
        sessionId: session.id,
        result: sub.grade,
        responseMs: sub.responseMs ?? null,
      },
    });

    results.push({
      userVocabId: uv.id,
      grade: sub.grade,
      correct: isCorrect,
      nextReviewAt: updated.nextReviewAt ?? srs.nextReviewAt,
      status: updated.status,
      masteryLevel: updated.masteryLevel,
    });
  }

  const total = correct + incorrect;
  const xpEarned = correct * 10;

  const activity = await recordActivity(userId, {
    wordsReviewed: total,
    correct,
    incorrect,
    xp: xpEarned,
    minutes: Math.max(1, Math.round(total / 10)),
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true },
  });

  await prisma.reviewSession.update({
    where: { id: session.id },
    data: {
      endedAt: new Date(),
      wordsStudied: total,
      correct,
      incorrect,
      xpEarned,
    },
  });

  return {
    results,
    total,
    correct,
    incorrect,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    xpEarned,
    newStreak: user.streak,
    goalAchieved: activity.goalAchieved,
    todayLearned: activity.todayLearned,
    dailyGoal: activity.dailyGoal,
  };
}
