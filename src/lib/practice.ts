import type { PracticeType } from "@/types";
import { stripDiacritics, stripPinyinTones } from "./utils";

/** Chuẩn hóa câu trả lời để so sánh (không phân biệt hoa/thường, dấu, thanh điệu). */
export function normalizeAnswer(value: string): string {
  return stripDiacritics(value)
    .replace(/[.,!?;:"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizePinyin(value: string): string {
  return stripPinyinTones(value.replace(/\s+/g, ""));
}

/** Loại bỏ khoảng trắng + dấu câu — dùng cho bài sắp xếp câu. */
export function normalizeSentence(value: string): string {
  return stripDiacritics(value)
    .replace(/[\s.,!?;:"'`]/g, "")
    .toLowerCase();
}

export function evaluateAnswer(
  type: PracticeType,
  userAnswer: string,
  correctAnswer: string,
): boolean {
  const user = userAnswer.trim();
  const correct = correctAnswer.trim();
  if (!user) return false;

  switch (type) {
    case "pinyin":
      return normalizePinyin(user) === normalizePinyin(correct);
    case "scramble":
      return normalizeSentence(user) === normalizeSentence(correct);
    case "hanzi":
      return user.replace(/\s+/g, "") === correct.replace(/\s+/g, "");
    default:
      return normalizeAnswer(user) === normalizeAnswer(correct);
  }
}
