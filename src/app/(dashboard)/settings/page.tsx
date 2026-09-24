import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { requireUser } from "@/services/auth.service";
import { SettingsForm } from "@/components/settings/settings-form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Cài đặt · LINGUAFLOW",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const [profile, userSettings] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Settings className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">Quản lý hồ sơ, mục tiêu, giao diện và thông báo.</p>
        </div>
      </div>

      <SettingsForm
        initial={{
          name: user.name ?? "Học viên",
          email: user.email ?? "",
          language: (user.language ?? "both") as "chinese" | "english" | "both",
          dailyGoal: user.goalDaily ?? 20,
          englishLevel: profile?.englishLevel ?? null,
          chineseLevel: profile?.chineseLevel ?? null,
          theme: (userSettings?.theme ?? "system") as "system" | "light" | "dark",
          soundEnabled: userSettings?.soundEnabled ?? true,
          ttsRate: userSettings?.ttsRate ?? 1.0,
          notifyReviews: userSettings?.notifyReviews ?? true,
          notifyStreak: userSettings?.notifyStreak ?? true,
          notifyAchievements: userSettings?.notifyAchievements ?? true,
        }}
      />
    </div>
  );
}