import { prisma } from "@/lib/db";
import { stripDiacritics, stripPinyinTones, startOfDay } from "@/lib/utils";
import type { VocabularyFilterInput } from "@/lib/validations";
import type { VocabLanguage } from "@/types";
import type { Prisma, Vocabulary, UserVocabulary } from "@prisma/client";

function scoreMatch(v: Vocabulary, query: string): number {
  const raw = query.trim().toLowerCase();
  const nq = stripDiacritics(raw);
  const word = v.normalizedWord.toLowerCase();
  const meaning = stripDiacritics(v.meaningVi);
  const py = v.pinyin ? stripPinyinTones(v.pinyin) : "";
  const pyQuery = stripPinyinTones(raw).replace(/\s+/g, "");

  if (v.word === query.trim() || word === nq) return 100;
  if (py && py === pyQuery) return 96;
  if (v.word.includes(query.trim()) && query.trim().length >= 2) return 88;
  if (py && pyQuery && py.includes(pyQuery)) return 84;
  if (word.includes(nq)) return 78;
  if (meaning === nq) return 82;
  if (meaning.includes(nq)) return 74;
  if (meaning.split(/\s+/).some((w) => w === nq)) return 76;
  if (v.exampleSentence && stripDiacritics(v.exampleSentence).includes(nq)) return 50;
  if (v.exampleTranslation && stripDiacritics(v.exampleTranslation).includes(nq)) return 60;
  return 0;
}

export interface SearchOptions {
  language?: VocabLanguage | "all";
  take?: number;
}

export async function searchVocabulary(query: string, options: SearchOptions = {}) {
  const { language = "all", take = 20 } = options;
  const q = query.trim();
  if (!q) return [];

  const rows = await prisma.vocabulary.findMany({
    where: language === "all" ? {} : { language },
    take: 3000,
  });

  return rows
    .map((v) => ({ v, score: scoreMatch(v, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.v.word.localeCompare(b.v.word))
    .slice(0, take)
    .map((r) => r.v);
}

export async function getVocabularyById(id: string) {
  return prisma.vocabulary.findUnique({ where: { id } });
}

export async function findExactWord(word: string, language: VocabLanguage) {
  return prisma.vocabulary.findUnique({
    where: { language_word: { language, word: word.trim() } },
  });
}

/** Lưu từ vào thư viện cá nhân. Idempotent. */
export async function saveVocabulary(userId: string, vocabularyId: string) {
  const existing = await prisma.userVocabulary.findUnique({
    where: { userId_vocabularyId: { userId, vocabularyId } },
  });

  if (existing) {
    const updated = await prisma.userVocabulary.update({
      where: { id: existing.id },
      data: { isSaved: true },
      include: { vocabulary: true },
    });
    return { created: false, item: updated };
  }

  const created = await prisma.userVocabulary.create({
    data: { userId, vocabularyId, isSaved: true, status: "new" },
    include: { vocabulary: true },
  });
  return { created: true, item: created };
}

export async function bulkSaveVocabulary(userId: string, vocabularyIds: string[]) {
  let createdCount = 0;
  for (const vocabularyId of vocabularyIds) {
    const existing = await prisma.userVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });
    if (existing) {
      if (!existing.isSaved) {
        await prisma.userVocabulary.update({ where: { id: existing.id }, data: { isSaved: true } });
      }
      continue;
    }
    await prisma.userVocabulary.create({
      data: { userId, vocabularyId, isSaved: true, status: "new" },
    });
    createdCount += 1;
  }
  return { created: createdCount, total: vocabularyIds.length };
}

export async function removeUserVocabulary(userId: string, userVocabId: string) {
  const item = await prisma.userVocabulary.findFirst({
    where: { id: userVocabId, userId },
  });
  if (!item) throw new Error("NOT_FOUND");
  await prisma.userVocabulary.delete({ where: { id: item.id } });
}

export interface VocabularyFilter extends Partial<VocabularyFilterInput> {
  page?: number;
  pageSize?: number;
}

export async function getMyVocabularies(userId: string, filter: VocabularyFilter = {}) {
  const {
    q,
    language = "all",
    status = "all",
    sort = "recent",
    page = 1,
    pageSize = 20,
  } = filter;

  const where: Prisma.UserVocabularyWhereInput = {
    userId,
    ...(language !== "all" ? { vocabulary: { language } } : {}),
    ...(status !== "all" ? { status } : {}),
  };

  const rows = await prisma.userVocabulary.findMany({
    where,
    include: { vocabulary: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  let filtered = rows;
  if (q?.trim()) {
    const nq = stripDiacritics(q.trim());
    filtered = rows.filter((r) => {
      const v = r.vocabulary;
      return (
        stripDiacritics(v.word).includes(nq) ||
        stripDiacritics(v.meaningVi).includes(nq) ||
        (v.pinyin ? stripPinyinTones(v.pinyin).includes(stripPinyinTones(nq)) : false)
      );
    });
  }

  const sorted = [...filtered];
  switch (sort) {
    case "alphabet":
      sorted.sort((a, b) => a.vocabulary.word.localeCompare(b.vocabulary.word));
      break;
    case "difficulty":
      sorted.sort((a, b) => b.vocabulary.difficulty - a.vocabulary.difficulty);
      break;
    case "nextReview":
      sorted.sort((a, b) => {
        const av = a.nextReviewAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bv = b.nextReviewAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return av - bv;
      });
      break;
    default:
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = sorted.slice((page - 1) * pageSize, page * pageSize);

  const counts = await prisma.userVocabulary.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });
  const statusCounts: Record<string, number> = { new: 0, learning: 0, review: 0, mastered: 0 };
  for (const c of counts) statusCounts[c.status] = c._count;

  return { items, total, page, totalPages, statusCounts };
}

export interface DeckOptions {
  userId: string;
  topicSlug?: string;
  language?: VocabLanguage | "all";
  limit?: number;
  includeLearned?: boolean;
}

export type DeckItem = Vocabulary & {
  userVocabulary: UserVocabulary | null;
};

/** Bộ flashcard: ưu tiên từ mới, sau đó từ đang học. */
export async function getLearnDeck(options: DeckOptions): Promise<DeckItem[]> {
  const { userId, topicSlug, language = "all", limit = 30, includeLearned = false } = options;

  let vocabularyRows: Vocabulary[] = [];

  if (topicSlug) {
    const topic = await prisma.topic.findUnique({
      where: { slug: topicSlug },
      include: {
        vocabularies: {
          include: { vocabulary: true },
          orderBy: { order: "asc" },
        },
      },
    });
    vocabularyRows = topic?.vocabularies.map((tv) => tv.vocabulary) ?? [];
  } else {
    vocabularyRows = await prisma.vocabulary.findMany({
      where: {
        ...(language !== "all" ? { language } : {}),
        isCommon: true,
      },
      orderBy: [{ difficulty: "asc" }, { word: "asc" }],
      take: 400,
    });
    if (!vocabularyRows.length) {
      vocabularyRows = await prisma.vocabulary.findMany({
        where: language !== "all" ? { language } : {},
        take: 400,
      });
    }
  }

  if (language !== "all") {
    vocabularyRows = vocabularyRows.filter((v) => v.language === language);
  }

  const ids = vocabularyRows.map((v) => v.id);
  const userVocs = await prisma.userVocabulary.findMany({
    where: { userId, vocabularyId: { in: ids } },
  });
  const uvMap = new Map(userVocs.map((uv) => [uv.vocabularyId, uv]));

  const statusRank: Record<string, number> = { none: 0, new: 1, learning: 2, review: 3, mastered: 4 };

  const items: DeckItem[] = vocabularyRows.map((v) => ({
    ...v,
    userVocabulary: uvMap.get(v.id) ?? null,
  }));

  items.sort((a, b) => {
    const sa = statusRank[a.userVocabulary?.status ?? "none"];
    const sb = statusRank[b.userVocabulary?.status ?? "none"];
    if (sa !== sb) return sa - sb;
    return a.difficulty - b.difficulty;
  });

  const fresh = includeLearned ? items : items.filter((i) => !i.userVocabulary || i.userVocabulary.status !== "mastered");
  return fresh.slice(0, limit);
}

export async function getSavedCount(userId: string) {
  return prisma.userVocabulary.count({ where: { userId, isSaved: true } });
}

/** Từ liên quan: cùng chủ đề + cùng từ loại. */
export async function getRelatedVocabulary(vocab: Vocabulary, take = 6): Promise<Vocabulary[]> {
  const topicLinks = await prisma.topicVocabulary.findMany({
    where: { vocabularyId: vocab.id },
    select: { topicId: true },
  });

  const related = await prisma.vocabulary.findMany({
    where: {
      id: { not: vocab.id },
      language: vocab.language,
      OR: [
        { topics: { some: { topicId: { in: topicLinks.map((t) => t.topicId) } } } },
        { partOfSpeech: vocab.partOfSpeech ?? undefined },
        { meaningVi: vocab.meaningVi },
      ],
    },
    take,
  });
  return related;
}

export async function countDueToday(userId: string) {
  return prisma.userVocabulary.count({
    where: {
      userId,
      nextReviewAt: { not: null, lte: new Date() },
    },
  });
}

export async function isReviewedToday(userId: string): Promise<boolean> {
  const today = startOfDay();
  const record = await prisma.reviewRecord.findFirst({
    where: { userId, createdAt: { gte: today } },
    select: { id: true },
  });
  return Boolean(record);
}
