import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { topics } from "./seed-data/topics";
import { achievements } from "./seed-data/achievements";
import { englishWords } from "./seed-data/en";
import { chineseWords } from "./seed-data/cn";
import type { SeedWord } from "./seed-data/types";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@linguaflow.app";
const DEMO_PASSWORD = "Demo123!";

function normalizeWord(w: SeedWord): string {
  if (w.pinyin) return w.word;
  return w.word.toLowerCase().trim();
}

async function upsertTopics() {
  const created = new Map<string, string>();
  for (const t of topics) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {
        nameVi: t.nameVi,
        description: t.description,
        language: t.language,
        emoji: t.emoji,
        difficulty: t.difficulty,
        estMinutes: t.estMinutes,
      },
      create: {
        slug: t.slug,
        nameVi: t.nameVi,
        description: t.description,
        language: t.language,
        emoji: t.emoji,
        difficulty: t.difficulty,
        estMinutes: t.estMinutes,
      },
    });
    created.set(t.slug, topic.id);
  }
  return created;
}

async function upsertVocabulary(language: "english" | "chinese", words: SeedWord[]) {
  const created = new Map<string, string>();
  for (const w of words) {
    const v = await prisma.vocabulary.upsert({
      where: { language_word: { language, word: w.word } },
      update: {
        normalizedWord: normalizeWord(w),
        pronunciation: w.ipa ?? null,
        pinyin: w.pinyin ?? null,
        traditional: w.traditional ?? null,
        meaningVi: w.meaning,
        partOfSpeech: w.pos,
        exampleSentence: w.example,
        exampleTranslation: w.exampleVi,
        charAnalysis: w.analysis ?? null,
        difficulty: w.difficulty,
        level: w.level,
        isCommon: w.common ?? false,
      },
      create: {
        language,
        word: w.word,
        normalizedWord: normalizeWord(w),
        pronunciation: w.ipa ?? null,
        pinyin: w.pinyin ?? null,
        traditional: w.traditional ?? null,
        meaningVi: w.meaning,
        partOfSpeech: w.pos,
        exampleSentence: w.example,
        exampleTranslation: w.exampleVi,
        charAnalysis: w.analysis ?? null,
        difficulty: w.difficulty,
        level: w.level,
        isCommon: w.common ?? false,
      },
    });
    created.set(w.word, v.id);
  }
  return created;
}

async function linkTopics(
  topicIds: Map<string, string>,
  vocabIds: Map<string, string>,
  words: SeedWord[],
) {
  const orderCounter = new Map<string, number>();
  for (const w of words) {
    const topicId = topicIds.get(w.topic);
    const vocabId = vocabIds.get(w.word);
    if (!topicId || !vocabId) continue;
    const order = orderCounter.get(w.topic) ?? 0;
    orderCounter.set(w.topic, order + 1);
    await prisma.topicVocabulary.upsert({
      where: { topicId_vocabularyId: { topicId, vocabularyId: vocabId } },
      update: { order },
      create: { topicId, vocabularyId: vocabId, order },
    });
  }
}

async function upsertAchievements() {
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: {
        titleVi: a.titleVi,
        description: a.description,
        icon: a.icon,
        xpReward: a.xpReward,
        category: a.category,
      },
      create: {
        code: a.code,
        titleVi: a.titleVi,
        description: a.description,
        icon: a.icon,
        xpReward: a.xpReward,
        category: a.category,
      },
    });
  }
}

async function seedDemoUser(enIds: string[], cnIds: string[]) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      passwordHash,
      name: "Minh Anh",
      language: "both",
      goalDaily: 50,
      xp: 1240,
      level: 6,
      streak: 7,
      longestStreak: 12,
      onboarded: true,
    },
    create: {
      email: DEMO_EMAIL,
      name: "Minh Anh",
      passwordHash,
      language: "both",
      goalDaily: 50,
      xp: 1240,
      level: 6,
      streak: 7,
      longestStreak: 12,
      onboarded: true,
      profile: {
        create: {
          bio: "Đang học song song tiếng Anh và tiếng Trung 🌏",
          nativeLanguage: "vi",
          englishLevel: "intermediate",
          chineseLevel: "hsk3",
          motivation: "ielts",
          dailyGoalMinutes: 30,
        },
      },
      settings: {
        create: {
          theme: "system",
          dailyGoal: 50,
          language: "both",
          englishLevel: "intermediate",
          chineseLevel: "hsk3",
          motivation: "ielts",
          soundEnabled: true,
          ttsRate: 1,
        },
      },
    },
  });

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const allIds = [...enIds, ...cnIds];

  const statuses = [
    "mastered",
    "mastered",
    "review",
    "learning",
    "learning",
    "new",
    "mastered",
    "review",
    "learning",
    "new",
  ];

  for (let i = 0; i < allIds.length; i++) {
    const vocabularyId = allIds[i];
    const status = statuses[i % statuses.length];
    const isKnown = status !== "new";
    const masteryLevel =
      status === "mastered" ? 5 : status === "review" ? 3 : status === "learning" ? 1 : 0;
    const interval = status === "mastered" ? 30 : status === "review" ? 7 : status === "learning" ? 3 : 0;
    const nextIn = status === "mastered" ? day * 20 : status === "review" ? day * ((i % 5) - 2) : status === "learning" ? day : day * 30;
    const correct = isKnown ? 2 + (i % 7) : 0;
    const incorrect = isKnown ? i % 3 : 0;

    await prisma.userVocabulary.upsert({
      where: {
        userId_vocabularyId: { userId: user.id, vocabularyId },
      },
      update: {
        status,
        masteryLevel,
        interval,
        easeFactor: 2.5,
        repetitionCount: isKnown ? 2 + (i % 5) : 0,
        nextReviewAt: status === "new" ? null : new Date(now + nextIn),
        lastReviewedAt: isKnown ? new Date(now - day * ((i % 6) + 1)) : null,
        correctCount: correct,
        incorrectCount: incorrect,
        isSaved: i % 4 !== 3,
      },
      create: {
        userId: user.id,
        vocabularyId,
        status,
        masteryLevel,
        interval,
        easeFactor: 2.5,
        repetitionCount: isKnown ? 2 + (i % 5) : 0,
        nextReviewAt: status === "new" ? null : new Date(now + nextIn),
        lastReviewedAt: isKnown ? new Date(now - day * ((i % 6) + 1)) : null,
        correctCount: correct,
        incorrectCount: incorrect,
        isSaved: i % 4 !== 3,
      },
    });
  }

  // Giải thưởng mặc định cho demo user
  const allAchievements = await prisma.achievement.findMany();
  const unlockedCodes = ["first-word", "words-100", "streak-7", "quiz-perfect", "english-starter", "daily-goal-1", "review-50", "hsk1-complete", "master-10"];
  for (const a of allAchievements) {
    if (!unlockedCodes.includes(a.code)) continue;
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: user.id, achievementId: a.id } },
      update: {},
      create: { userId: user.id, achievementId: a.id },
    });
  }

  // 7 ngày hoạt động gần nhất để có biểu đồ
  const weekly = [
    { learned: 24, reviewed: 18, correct: 30, incorrect: 6, xp: 180, mins: 22, goal: true },
    { learned: 31, reviewed: 22, correct: 40, incorrect: 9, xp: 240, mins: 28, goal: true },
    { learned: 18, reviewed: 15, correct: 25, incorrect: 5, xp: 130, mins: 16, goal: false },
    { learned: 40, reviewed: 26, correct: 52, incorrect: 11, xp: 300, mins: 35, goal: true },
    { learned: 27, reviewed: 30, correct: 44, incorrect: 8, xp: 220, mins: 25, goal: true },
    { learned: 35, reviewed: 28, correct: 49, incorrect: 7, xp: 270, mins: 31, goal: true },
    { learned: 33, reviewed: 24, correct: 46, incorrect: 6, xp: 260, mins: 29, goal: true },
  ];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const w = weekly[6 - i];
    await prisma.dailyProgress.upsert({
      where: { userId_date: { userId: user.id, date: d } },
      update: {
        wordsLearned: w.learned,
        wordsReviewed: w.reviewed,
        correctAnswers: w.correct,
        incorrectAnswers: w.incorrect,
        xpEarned: w.xp,
        minutesLearned: w.mins,
        goalAchieved: w.goal,
      },
      create: {
        userId: user.id,
        date: d,
        wordsLearned: w.learned,
        wordsReviewed: w.reviewed,
        correctAnswers: w.correct,
        incorrectAnswers: w.incorrect,
        xpEarned: w.xp,
        minutesLearned: w.mins,
        goalAchieved: w.goal,
      },
    });
  }

  // Đặt lastActiveDate để streak không bị reset ngay
  const yesterday = new Date();
  yesterday.setHours(12, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveDate: yesterday, longestStreak: 12 },
  });

  return user;
}

async function main() {
  console.log("🌱 Seeding LINGUAFLOW database...\n");

  // Xóa dữ liệu cũ (dev seed idempotent)
  await prisma.reviewRecord.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.reviewSession.deleteMany();
  await prisma.learningSession.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.dailyProgress.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.topicVocabulary.deleteMany();
  await prisma.userVocabulary.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const topicIds = await upsertTopics();
  console.log(`✅ ${topicIds.size} topics`);

  const enIds = await upsertVocabulary("english", englishWords);
  const cnIds = await upsertVocabulary("chinese", chineseWords);
  console.log(`✅ ${enIds.size} English words, ${cnIds.size} Chinese words`);

  await linkTopics(topicIds, enIds, englishWords);
  await linkTopics(topicIds, cnIds, chineseWords);
  console.log(`✅ Topic links created`);

  await upsertAchievements();
  console.log(`✅ ${achievements.length} achievements`);

  const demo = await seedDemoUser([...enIds.values()], [...cnIds.values()]);
  console.log(`✅ Demo user: ${demo.email} / ${DEMO_PASSWORD}`);

  console.log("\n🎉 Seed completed!");
  console.log(`   Total vocabulary: ${enIds.size + cnIds.size}`);
  console.log(`   Topics: ${topicIds.size}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
