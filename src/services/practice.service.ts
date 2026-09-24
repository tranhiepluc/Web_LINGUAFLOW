import { prisma } from "@/lib/db";
import { evaluateAnswer } from "@/lib/practice";
import { recordActivity } from "./gamification.service";
import type { PracticeQuestion, PracticeType, VocabLanguage, PracticeChoice } from "@/types";
import type { Vocabulary } from "@prisma/client";

export const PRACTICE_TYPES: {
  type: PracticeType;
  titleVi: string;
  description: string;
}[] = [
  { type: "multiple-choice", titleVi: "Chọn đáp án", description: "Chọn từ hoặc nghĩa đúng trong 4 lựa chọn." },
  { type: "fill-blank", titleVi: "Điền vào chỗ trống", description: "Điền từ còn thiếu vào câu." },
  { type: "listening", titleVi: "Luyện nghe", description: "Nghe phát âm và chọn đáp án đúng." },
  { type: "translate", titleVi: "Dịch câu", description: "Dịch câu tiếng Việt sang tiếng Anh/Trung." },
  { type: "pinyin", titleVi: "Luyện Pinyin", description: "Xem chữ Hán và viết đúng pinyin." },
  { type: "hanzi", titleVi: "Nhận diện chữ Hán", description: "Nghe/đọc pinyin và chọn chữ Hán đúng." },
  { type: "scramble", titleVi: "Sắp xếp câu", description: "Xếp các từ thành câu có nghĩa." },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getPool(userId: string, language: VocabLanguage): Promise<Vocabulary[]> {
  const userWords = await prisma.userVocabulary.findMany({
    where: { userId, status: { not: "new" }, vocabulary: { language } },
    select: { vocabulary: true },
    take: 300,
  });

  let pool = userWords.map((u) => u.vocabulary);
  if (pool.length < 40) {
    const extra = await prisma.vocabulary.findMany({
      where: { language },
      orderBy: [{ isCommon: "desc" }, { difficulty: "asc" }],
      take: 200,
    });
    const seen = new Set(pool.map((p) => p.id));
    pool = [...pool, ...extra.filter((e) => !seen.has(e.id))];
  }
  return pool;
}

function wordLabel(v: Vocabulary): string {
  return v.pinyin ? `${v.word} (${v.pinyin})` : v.word;
}

function choiceDistractors(pool: Vocabulary[], correct: Vocabulary, count: number): Vocabulary[] {
  const others = shuffle(pool.filter((p) => p.id !== correct.id && p.meaningVi !== correct.meaningVi));
  return others.slice(0, count);
}

function buildChoices(
  pool: Vocabulary[],
  correct: Vocabulary,
  mode: "word" | "meaning",
): PracticeChoice[] {
  const distractors = choiceDistractors(pool, correct, 3);
  const all = shuffle([correct, ...distractors]);
  return all.map((v) => ({
    label: mode === "word" ? wordLabel(v) : v.meaningVi,
    value: mode === "word" ? v.word : v.meaningVi,
    isCorrect: v.id === correct.id,
  }));
}

function scrambleTokens(sentence: string, language: VocabLanguage): string[] {
  const clean = sentence.replace(/[\s.,!?;:"'`，。！？；：、""''…·．]/g, "");
  if (language === "chinese") {
    const chars = clean.split("");
    if (chars.length <= 14) return chars;
    const chunks: string[] = [];
    for (let i = 0; i < chars.length; i += 2) chunks.push(chars.slice(i, i + 2).join(""));
    return chunks;
  }
  return clean.split(/\s+/).filter(Boolean);
}

export interface GenerateOptions {
  type: PracticeType;
  language: VocabLanguage;
  count?: number;
}

export async function generatePractice(
  userId: string,
  options: GenerateOptions,
): Promise<PracticeQuestion[]> {
  const { type, language, count = 8 } = options;
  const pool = await getPool(userId, language);
  if (pool.length < 4) return [];

  const suitable = pool.filter((v) => {
    if (type === "fill-blank" || type === "translate" || type === "scramble") {
      if (!v.exampleSentence || !v.exampleTranslation) return false;
      if (type === "scramble") {
        const len = v.exampleSentence.replace(/\s+/g, "").length;
        return language === "chinese" ? len >= 4 && len <= 16 : true;
      }
      if (type === "fill-blank") {
        return language === "chinese"
          ? v.exampleSentence.includes(v.word)
          : new RegExp(`\\b${v.word}\\b`, "i").test(v.exampleSentence);
      }
      return true;
    }
    if (type === "pinyin") return language === "chinese" && Boolean(v.pinyin);
    if (type === "hanzi") return language === "chinese" && Boolean(v.pinyin);
    if (type === "listening") return Boolean(v.pronunciation || v.pinyin);
    return true;
  });

  const selected = shuffle(suitable.length >= count ? suitable : pool).slice(0, count);
  const questions: PracticeQuestion[] = [];

  selected.forEach((v, index) => {
    const id = `${type}-${index}`;
    const explanationBase = v.pinyin
      ? `${v.word} (${v.pinyin}) = ${v.meaningVi}`
      : `${v.word} = ${v.meaningVi}`;

    switch (type) {
      case "multiple-choice": {
        const toWord = index % 2 === 0;
        if (toWord) {
          questions.push({
            id,
            type,
            prompt: `Từ nào có nghĩa là “${v.meaningVi}”?`,
            promptLang: language,
            choices: buildChoices(pool, v, "word"),
            answer: v.word,
            explanation: explanationBase,
            vocabularyId: v.id,
            word: v.word,
          });
        } else {
          questions.push({
            id,
            type,
            prompt: `“${wordLabel(v)}” có nghĩa là gì?`,
            promptLang: language,
            choices: buildChoices(pool, v, "meaning"),
            answer: v.meaningVi,
            explanation: explanationBase,
            vocabularyId: v.id,
            word: v.word,
          });
        }
        break;
      }
      case "fill-blank": {
        let sentence = v.exampleSentence ?? "";
        if (language === "chinese") {
          sentence = sentence.replace(v.word, "____");
        } else {
          sentence = sentence.replace(new RegExp(`\\b${v.word}\\b`, "i"), "____");
        }
        questions.push({
          id,
          type,
          prompt: sentence,
          promptLang: language,
          subtitle: v.meaningVi,
          answer: v.word,
          explanation: `${v.exampleSentence} → ${v.exampleTranslation}`,
          vocabularyId: v.id,
          word: v.word,
        });
        break;
      }
      case "listening": {
        questions.push({
          id,
          type,
          prompt: v.word,
          promptLang: language,
          choices: buildChoices(pool, v, "meaning"),
          answer: v.meaningVi,
          explanation: explanationBase,
          vocabularyId: v.id,
          word: v.word,
        });
        break;
      }
      case "translate": {
        questions.push({
          id,
          type,
          prompt: v.exampleTranslation ?? v.meaningVi,
          promptLang: "english",
          subtitle: v.partOfSpeech ?? undefined,
          answer: v.exampleSentence ?? v.word,
          explanation: `${v.exampleSentence} = ${v.exampleTranslation}`,
          vocabularyId: v.id,
          word: v.word,
        });
        break;
      }
      case "pinyin": {
        questions.push({
          id,
          type,
          prompt: v.word,
          promptLang: "chinese",
          subtitle: v.meaningVi,
          answer: v.pinyin ?? "",
          explanation: `${v.word} = ${v.pinyin} = ${v.meaningVi}`,
          vocabularyId: v.id,
          word: v.word,
        });
        break;
      }
      case "hanzi": {
        questions.push({
          id,
          type,
          prompt: v.pinyin ?? "",
          promptLang: "chinese",
          subtitle: v.meaningVi,
          choices: buildChoices(pool, v, "word"),
          answer: v.word,
          explanation: `${v.pinyin} = ${v.word} = ${v.meaningVi}`,
          vocabularyId: v.id,
          word: v.word,
        });
        break;
      }
      case "scramble": {
        const tokens = scrambleTokens(v.exampleSentence ?? "", language);
        questions.push({
          id,
          type,
          prompt: v.exampleTranslation ?? v.meaningVi,
          promptLang: language,
          tokens: shuffle(tokens),
          answer: v.exampleSentence ?? v.word,
          explanation: `${v.exampleSentence} = ${v.exampleTranslation}`,
          vocabularyId: v.id,
          word: v.word,
        });
        break;
      }
    }
  });

  return questions;
}

export interface PracticeAnswerSubmission {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
}

export interface PracticeOutcome {
  quizId: string;
  score: number;
  correct: number;
  incorrect: number;
  total: number;
  xpEarned: number;
  streak: number;
  goalAchieved: boolean;
  todayLearned: number;
  dailyGoal: number;
}

/** Server tự tính lại độ chính xác — không tin client. */
export async function savePracticeResult(
  userId: string,
  payload: {
    type: PracticeType;
    language: VocabLanguage;
    answers: PracticeAnswerSubmission[];
  },
): Promise<PracticeOutcome> {
  const { type, language, answers } = payload;
  if (!answers.length) throw new Error("VALIDATION: chưa có câu trả lời");

  const typeMap: Record<PracticeType, string> = {
    "multiple-choice": "multiple-choice",
    "fill-blank": "fill-blank",
    listening: "listening",
    translate: "translate",
    pinyin: "pinyin",
    hanzi: "hanzi",
    scramble: "scramble",
  };

  let correct = 0;
  const rows = answers.map((a) => {
    const isCorrect = evaluateAnswer(type, a.userAnswer, a.correctAnswer);
    if (isCorrect) correct += 1;
    return {
      question: a.questionId,
      userAnswer: a.userAnswer.slice(0, 500),
      correctAnswer: a.correctAnswer.slice(0, 500),
      isCorrect,
    };
  });

  const total = rows.length;
  const score = Math.round((correct / total) * 100);
  const xpEarned = correct * 10;

  const quiz = await prisma.quiz.create({
    data: {
      userId,
      type: typeMap[type],
      language,
      score,
      totalQuestions: total,
      questions: { create: rows },
    },
  });

  const activity = await recordActivity(userId, {
    wordsReviewed: total,
    correct,
    incorrect: total - correct,
    xp: xpEarned,
    minutes: Math.max(1, Math.round(total / 8)),
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true },
  });

  return {
    quizId: quiz.id,
    score,
    correct,
    incorrect: total - correct,
    total,
    xpEarned,
    streak: user.streak,
    goalAchieved: activity.goalAchieved,
    todayLearned: activity.todayLearned,
    dailyGoal: activity.dailyGoal,
  };
}
