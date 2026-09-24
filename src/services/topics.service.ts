import { prisma } from "@/lib/db";
import type { VocabLanguage } from "@/types";

export interface TopicWithProgress {
  id: string;
  slug: string;
  nameVi: string;
  description: string;
  language: VocabLanguage;
  emoji: string;
  difficulty: number;
  estMinutes: number;
  wordCount: number;
  learnedCount: number;
  masteredCount: number;
  percent: number;
}

export async function getTopics(
  userId: string,
  language?: VocabLanguage | "all",
): Promise<TopicWithProgress[]> {
  const topics = await prisma.topic.findMany({
    where: language && language !== "all" ? { language } : {},
    include: {
      vocabularies: { select: { vocabularyId: true } },
    },
    orderBy: [{ language: "asc" }, { difficulty: "asc" }],
  });

  const topicIds = topics.map((t) => t.id);
  const userVocs = await prisma.userVocabulary.findMany({
    where: {
      userId,
      vocabulary: { topics: { some: { topicId: { in: topicIds } } } },
    },
    select: { status: true, vocabulary: { select: { topics: { select: { topicId: true } } } } },
  });

  const learnedByTopic = new Map<string, { learned: number; mastered: number }>();
  for (const uv of userVocs) {
    for (const link of uv.vocabulary.topics) {
      const entry = learnedByTopic.get(link.topicId) ?? { learned: 0, mastered: 0 };
      if (uv.status !== "new") entry.learned += 1;
      if (uv.status === "mastered") entry.mastered += 1;
      learnedByTopic.set(link.topicId, entry);
    }
  }

  return topics.map((t) => {
    const progress = learnedByTopic.get(t.id) ?? { learned: 0, mastered: 0 };
    const wordCount = t.vocabularies.length;
    return {
      id: t.id,
      slug: t.slug,
      nameVi: t.nameVi,
      description: t.description,
      language: t.language as VocabLanguage,
      emoji: t.emoji,
      difficulty: t.difficulty,
      estMinutes: t.estMinutes,
      wordCount,
      learnedCount: progress.learned,
      masteredCount: progress.mastered,
      percent: wordCount ? Math.round((progress.learned / wordCount) * 100) : 0,
    };
  });
}

export async function getTopicDetail(userId: string, slug: string) {
  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      vocabularies: {
        include: { vocabulary: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!topic) return null;

  const ids = topic.vocabularies.map((tv) => tv.vocabularyId);
  const userVocs = await prisma.userVocabulary.findMany({
    where: { userId, vocabularyId: { in: ids } },
  });
  const uvMap = new Map(userVocs.map((uv) => [uv.vocabularyId, uv]));

  const words = topic.vocabularies.map((tv) => ({
    ...tv.vocabulary,
    userVocabulary: uvMap.get(tv.vocabularyId) ?? null,
  }));

  const learned = words.filter((w) => w.userVocabulary && w.userVocabulary.status !== "new").length;
  const mastered = words.filter((w) => w.userVocabulary?.status === "mastered").length;

  return {
    id: topic.id,
    slug: topic.slug,
    nameVi: topic.nameVi,
    description: topic.description,
    language: topic.language as VocabLanguage,
    emoji: topic.emoji,
    difficulty: topic.difficulty,
    estMinutes: topic.estMinutes,
    wordCount: words.length,
    learnedCount: learned,
    masteredCount: mastered,
    percent: words.length ? Math.round((learned / words.length) * 100) : 0,
    words,
  };
}
