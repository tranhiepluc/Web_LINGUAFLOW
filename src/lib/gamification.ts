/** Cấu hình XP, Level và mốc ngày. */

export const XP = {
  WORD_LEARNED: 5,
  CORRECT_ANSWER: 10,
  DAILY_GOAL: 50,
  STREAK_7: 100,
  REVIEW_SESSION: 5,
} as const;

export const LEVEL_THRESHOLDS: number[] = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.max(1, level);
}

export interface LevelProgress {
  level: number;
  currentXp: number;
  levelStartXp: number;
  nextLevelXp: number;
  percent: number;
  xpToNext: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const levelStartXp = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? levelStartXp + 1500;
  const span = Math.max(1, nextLevelXp - levelStartXp);
  const percent = Math.min(100, Math.round(((xp - levelStartXp) / span) * 100));
  return {
    level,
    currentXp: xp,
    levelStartXp,
    nextLevelXp,
    percent,
    xpToNext: Math.max(0, nextLevelXp - xp),
  };
}

export const LEVEL_TITLES = [
  "Người mới",
  "Người học",
  "Người chăm chỉ",
  "Người tiến bộ",
  "Người vững vàng",
  "Người thành thạo",
  "Người xuất sắc",
  "Bậc thầy",
  "Huyền thoại",
  "Thần đồng",
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, level - 1)] ?? "Người học";
}
