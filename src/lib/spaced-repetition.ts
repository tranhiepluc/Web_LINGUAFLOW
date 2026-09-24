/**
 * Hệ thống Spaced Repetition - SM-2 inspired.
 * Logic thuần túy, KHÔNG phụ thuộc React hay database.
 */

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface SRSState {
  easeFactor: number;
  interval: number;
  repetitionCount: number;
  masteryLevel: number;
}

export interface SRSResult extends SRSState {
  nextReviewAt: Date;
  status: "learning" | "review" | "mastered";
}

export const MIN_EASE = 1.3;
export const MAX_MASTERY = 5;

export const GRADE_LABELS: Record<ReviewGrade, string> = {
  again: "Chưa nhớ",
  hard: "Hơi nhớ",
  good: "Đã nhớ",
  easy: "Rất chắc",
};

export const GRADE_KEYS: Record<ReviewGrade, number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

const MILESTONES = [1, 3, 7, 14, 30, 60, 120];

function nextMilestone(interval: number): number {
  return MILESTONES.find((m) => m > interval) ?? Math.round(interval * 2.5);
}

function statusFromMastery(masteryLevel: number): SRSResult["status"] {
  if (masteryLevel >= 5) return "mastered";
  if (masteryLevel >= 3) return "review";
  return "learning";
}

function clampMastery(level: number): number {
  return Math.min(MAX_MASTERY, Math.max(0, level));
}

/**
 * Tính trạng thái SRS mới sau một lần ôn.
 * - again: về 0, ôn lại ngay (5 phút)
 * - hard:  interval ngắn hơn, ease giảm nhẹ
 * - good:  1 → 3 → interval × ease (chu kỳ SM-2)
 * - easy:  nhảy milestone, ease tăng
 */
export function scheduleReview(state: SRSState, grade: ReviewGrade, now: Date = new Date()): SRSResult {
  let { easeFactor, interval, repetitionCount, masteryLevel } = state;

  switch (grade) {
    case "again": {
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      interval = 0;
      repetitionCount = 0;
      masteryLevel = clampMastery(masteryLevel - 1);
      return finalize(easeFactor, interval, repetitionCount, masteryLevel, now, 5 * 60 * 1000);
    }
    case "hard": {
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
      repetitionCount += 1;
      masteryLevel = clampMastery(masteryLevel);
      break;
    }
    case "good": {
      if (repetitionCount === 0) interval = 1;
      else if (repetitionCount === 1) interval = 3;
      else interval = Math.max(nextMilestone(interval), Math.round(interval * easeFactor));
      easeFactor = easeFactor + 0.05;
      repetitionCount += 1;
      masteryLevel = clampMastery(masteryLevel + 1);
      break;
    }
    case "easy": {
      if (repetitionCount === 0) interval = 4;
      else interval = Math.max(nextMilestone(interval + 1), Math.round(interval * easeFactor * 1.3));
      easeFactor = easeFactor + 0.15;
      repetitionCount += 1;
      masteryLevel = clampMastery(masteryLevel + 2);
      break;
    }
  }

  return finalize(easeFactor, interval, repetitionCount, masteryLevel, now, interval * 24 * 60 * 60 * 1000);
}

function finalize(
  easeFactor: number,
  interval: number,
  repetitionCount: number,
  masteryLevel: number,
  now: Date,
  offsetMs: number,
): SRSResult {
  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    repetitionCount,
    masteryLevel,
    nextReviewAt: new Date(now.getTime() + offsetMs),
    status: statusFromMastery(masteryLevel),
  };
}

export function initialSRSState(): SRSState {
  return { easeFactor: 2.5, interval: 0, repetitionCount: 0, masteryLevel: 0 };
}

export function isDue(nextReviewAt: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt).getTime() <= now.getTime();
}

export type MasteryLabel = "Mới" | "Đang học" | "Đã quen" | "Thành thạo";

export function masteryLabel(status: string): MasteryLabel {
  switch (status) {
    case "mastered":
      return "Thành thạo";
    case "review":
      return "Đã quen";
    case "learning":
      return "Đang học";
    default:
      return "Mới";
  }
}

export function masteryPercent(masteryLevel: number): number {
  return Math.round((clampMastery(masteryLevel) / MAX_MASTERY) * 100);
}

/** Thứ tự ưu tiên ôn tập: quá hạn > đến hạn > từ yếu > từ vừa sai. */
export function reviewPriority(item: {
  nextReviewAt: Date | null;
  masteryLevel: number;
  incorrectCount: number;
  lastReviewedAt: Date | null;
}): number {
  const now = Date.now();
  const due = item.nextReviewAt ? new Date(item.nextReviewAt).getTime() : now + 365 * 24 * 3600 * 1000;
  const overdueDays = Math.max(0, (now - due) / (24 * 3600 * 1000));
  const weakness = (5 - item.masteryLevel) * 0.5 + item.incorrectCount * 0.2;
  // Số âm = ưu tiên cao hơn
  return due - now - overdueDays * 86400000 * 4 - weakness * 86400000;
}

export function estimateReviewTime(count: number): string {
  const seconds = count * 6;
  if (seconds < 60) return "dưới 1 phút";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} phút`;
  return `~${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}
