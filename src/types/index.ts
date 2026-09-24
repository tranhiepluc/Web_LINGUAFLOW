export type LearningLanguage = "english" | "chinese" | "both";
export type VocabLanguage = "english" | "chinese";
export type UserVocabStatus = "new" | "learning" | "review" | "mastered";

export interface VocabularyDto {
  id: string;
  language: VocabLanguage;
  word: string;
  normalizedWord: string;
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
  audioUrl: string | null;
  isCommon: boolean;
}

export interface UserVocabularyDto extends VocabularyDto {
  userVocabId: string;
  status: UserVocabStatus;
  easeFactor: number;
  interval: number;
  repetitionCount: number;
  masteryLevel: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  correctCount: number;
  incorrectCount: number;
  isSaved: boolean;
}

export interface ReviewAnswer {
  userVocabId: string;
  vocabularyId: string;
  grade: "again" | "hard" | "good" | "easy";
  responseMs?: number;
}

export interface SessionSummary {
  wordsStudied: number;
  correct: number;
  incorrect: number;
  xpEarned: number;
  streak: number;
  accuracy: number;
}

export type PracticeType =
  | "multiple-choice"
  | "fill-blank"
  | "listening"
  | "translate"
  | "pinyin"
  | "hanzi"
  | "scramble";

export interface PracticeChoice {
  label: string;
  value: string;
  isCorrect: boolean;
}

export interface PracticeQuestion {
  id: string;
  type: PracticeType;
  prompt: string;
  promptLang?: VocabLanguage;
  subtitle?: string;
  choices?: PracticeChoice[];
  /** Mảnh/từ từ để bài sắp xếp câu. */
  tokens?: string[];
  answer: string;
  explanation: string;
  vocabularyId?: string;
  word?: string;
}

export interface DashboardStats {
  totalLearned: number;
  dueToday: number;
  savedCount: number;
  streak: number;
  longestStreak: number;
  xp: number;
  level: number;
  todayLearned: number;
  dailyGoal: number;
  accuracy: number;
  totalReviews: number;
}

export interface AnalyzedWord {
  word: string;
  language: VocabLanguage;
  pinyin?: string;
  meaningVi: string;
  partOfSpeech?: string;
  difficulty: number;
  level?: string;
  example?: string;
  common?: boolean;
  /** Nếu có id từ điển thì từ có thể lưu trực tiếp vào thư viện. */
  vocabularyId?: string;
  /** false = chưa có trong từ điển (cần OpenAI hoặc tạo mới). */
  known: boolean;
}

export interface NotificationItem {
  id: string;
  type: "review" | "streak" | "level" | "achievement" | "goal";
  title: string;
  body: string;
  icon: string;
}
