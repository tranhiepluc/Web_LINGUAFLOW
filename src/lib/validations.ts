import { z } from "zod";

export const learningLanguages = ["english", "chinese", "both"] as const;
export const dailyGoals = [10, 20, 30, 50] as const;
export const motivations = [
  "giao_tiep",
  "du_lich",
  "cong_viec",
  "ielts",
  "toeic",
  "hsk",
  "phat_trien",
] as const;
export const englishLevels = [
  "beginner",
  "elementary",
  "intermediate",
  "upper_intermediate",
  "advanced",
] as const;
export const chineseLevels = ["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"] as const;

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(60, "Họ tên quá dài"),
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(72, "Mật khẩu quá dài")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
  language: z.enum(learningLanguages, {
    errorMap: () => ({ message: "Vui lòng chọn ngôn ngữ" }),
  }),
  goalDaily: z.coerce
    .number()
    .int()
    .min(5, "Tối thiểu 5 từ/ngày")
    .max(100, "Tối đa 100 từ/ngày"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const onboardingSchema = z
  .object({
    language: z.enum(learningLanguages),
    englishLevel: z.enum(englishLevels).optional(),
    chineseLevel: z.enum(chineseLevels).optional(),
    goalDaily: z
      .number()
      .int()
      .refine((v) => [10, 20, 30, 50].includes(v), { message: "Hãy chọn mục tiêu hằng ngày" }),
    motivation: z
      .string()
      .min(1, "Hãy chọn mục tiêu học tập của bạn")
      .refine(
        (v) => {
          const parts = v.split(",").filter(Boolean);
          return parts.length > 0 && parts.every((p) => (motivations as readonly string[]).includes(p));
        },
        { message: "Thông tin không hợp lệ" },
      ),
  })
  .refine((data) => data.language !== "english" || !!data.englishLevel, {
    message: "Hãy chọn trình độ tiếng Anh",
    path: ["englishLevel"],
  })
  .refine((data) => data.language !== "chinese" || !!data.chineseLevel, {
    message: "Hãy chọn trình độ tiếng Trung",
    path: ["chineseLevel"],
  });

export const dictionarySearchSchema = z.object({
  q: z.string().min(1, "Nhập từ cần tìm"),
  language: z.enum(["english", "chinese", "auto"]).default("auto"),
});

export const vocabularyFilterSchema = z.object({
  q: z.string().optional(),
  language: z.enum(["english", "chinese", "all"]).default("all"),
  status: z.enum(["new", "learning", "review", "mastered", "all"]).default("all"),
  sort: z.enum(["recent", "difficulty", "nextReview", "alphabet"]).default("recent"),
});

export const aiChatSchema = z.object({
  message: z.string().min(1, "Hãy nhập câu hỏi").max(1000, "Câu hỏi quá dài"),
  conversationId: z.string().optional(),
});

export const aiAnalyzeSchema = z.object({
  text: z
    .string()
    .min(20, "Đoạn văn quá ngắn (tối thiểu 20 ký tự)")
    .max(4000, "Đoạn văn quá dài (tối đa 4000 ký tự)"),
});

export const createTopicSchema = z.object({
  nameVi: z.string().min(2, "Tên bộ từ quá ngắn").max(60, "Tên bộ từ quá dài"),
  description: z.string().max(200, "Mô tả quá dài").optional().default(""),
  language: z.enum(["english", "chinese"]),
  wordIds: z.array(z.string()).min(1, "Hãy chọn ít nhất 1 từ").max(200),
});

export const settingsSchema = z.object({
  name: z.string().min(2).max(60),
  language: z.enum(learningLanguages),
  dailyGoal: z.coerce.number().int().min(5).max(100),
  englishLevel: z.enum(englishLevels).nullable().optional(),
  chineseLevel: z.enum(chineseLevels).nullable().optional(),
  theme: z.enum(["light", "dark", "system"]),
  soundEnabled: z.boolean(),
  ttsRate: z.coerce.number().min(0.5).max(1.6),
  notifyReviews: z.boolean(),
  notifyStreak: z.boolean(),
  notifyAchievements: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type VocabularyFilterInput = z.infer<typeof vocabularyFilterSchema>;
