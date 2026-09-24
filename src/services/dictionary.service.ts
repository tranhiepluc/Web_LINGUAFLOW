import { prisma } from "@/lib/db";
import { searchVocabulary, getRelatedVocabulary } from "./vocabulary.service";
import type { VocabLanguage } from "@/types";

export interface DictionaryEntry {
  vocabulary: {
    id: string;
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
    difficulty: number;
    level: string | null;
  };
  related: { id: string; word: string; meaningVi: string; pinyin: string | null }[];
  synonyms: { id: string; word: string; meaningVi: string; pinyin: string | null }[];
  isSaved: boolean;
}

export interface LookupResult {
  query: string;
  entries: DictionaryEntry[];
}

/** Tra cứu từ điển: EN↔VI, CN↔VI, VI→EN/CN (qua meaningVi). */
export async function lookup(
  query: string,
  language: VocabLanguage | "auto" = "auto",
  userId?: string,
): Promise<LookupResult> {
  const results = await searchVocabulary(query, {
    language: language === "auto" ? "all" : language,
    take: 10,
  });

  const entries: DictionaryEntry[] = [];

  for (const vocab of results.slice(0, 5)) {
    const [related, synonyms, saved] = await Promise.all([
      getRelatedVocabulary(vocab, 6),
      prisma.vocabulary.findMany({
        where: {
          language: vocab.language,
          meaningVi: vocab.meaningVi,
          id: { not: vocab.id },
        },
        take: 4,
      }),
      userId
        ? prisma.userVocabulary.findFirst({
            where: { userId, vocabularyId: vocab.id, isSaved: true },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    entries.push({
      vocabulary: {
        id: vocab.id,
        language: vocab.language as VocabLanguage,
        word: vocab.word,
        pronunciation: vocab.pronunciation,
        pinyin: vocab.pinyin,
        traditional: vocab.traditional,
        meaningVi: vocab.meaningVi,
        partOfSpeech: vocab.partOfSpeech,
        exampleSentence: vocab.exampleSentence,
        exampleTranslation: vocab.exampleTranslation,
        charAnalysis: vocab.charAnalysis,
        difficulty: vocab.difficulty,
        level: vocab.level,
      },
      related: related.map((r) => ({
        id: r.id,
        word: r.word,
        meaningVi: r.meaningVi,
        pinyin: r.pinyin,
      })),
      synonyms: synonyms.map((r) => ({
        id: r.id,
        word: r.word,
        meaningVi: r.meaningVi,
        pinyin: r.pinyin,
      })),
      isSaved: Boolean(saved),
    });
  }

  return { query, entries };
}
