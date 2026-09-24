import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    include: { settings: true, profile: true },
  });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

export async function createUserWithProfile(
  data: {
    name: string;
    email: string;
    passwordHash: string;
    language: string;
    goalDaily: number;
  },
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      language: data.language,
      goalDaily: data.goalDaily,
      profile: { create: { nativeLanguage: "vi" } },
      settings: {
        create: {
          language: data.language,
          dailyGoal: data.goalDaily,
        },
      },
    },
    include: { settings: true, profile: true },
  });
}

export interface OnboardingData {
  language: "english" | "chinese" | "both";
  englishLevel?: string;
  chineseLevel?: string;
  goalDaily: number;
  motivation: string;
}

export async function completeOnboarding(userId: string, data: OnboardingData) {
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        language: data.language,
        goalDaily: data.goalDaily,
        onboarded: true,
        profile: {
          upsert: {
            create: {
              nativeLanguage: "vi",
              englishLevel: data.englishLevel ?? null,
              chineseLevel: data.chineseLevel ?? null,
              motivation: data.motivation,
            },
            update: {
              englishLevel: data.englishLevel ?? null,
              chineseLevel: data.chineseLevel ?? null,
              motivation: data.motivation,
            },
          },
        },
        settings: {
          upsert: {
            create: {
              language: data.language,
              dailyGoal: data.goalDaily,
              englishLevel: data.englishLevel ?? null,
              chineseLevel: data.chineseLevel ?? null,
              motivation: data.motivation,
            },
            update: {
              language: data.language,
              dailyGoal: data.goalDaily,
              englishLevel: data.englishLevel ?? null,
              chineseLevel: data.chineseLevel ?? null,
              motivation: data.motivation,
            },
          },
        },
      },
      include: { settings: true, profile: true },
    }),
  ]);
  return user;
}
