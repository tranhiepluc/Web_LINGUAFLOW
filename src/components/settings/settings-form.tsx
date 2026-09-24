"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { BellRing, BookOpenCheck, Palette, Save, Volume2 } from "lucide-react";

import { updateSettingsAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { learningLanguages, englishLevels, chineseLevels } from "@/lib/validations";

export interface SettingsInitial {
  name: string;
  email: string;
  language: "english" | "chinese" | "both";
  dailyGoal: number;
  englishLevel: string | null;
  chineseLevel: string | null;
  theme: "light" | "dark" | "system";
  soundEnabled: boolean;
  ttsRate: number;
  notifyReviews: boolean;
  notifyStreak: boolean;
  notifyAchievements: boolean;
}

export function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const { setTheme } = useTheme();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SettingsInitial>(key: K, value: SettingsInitial[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const themeChange = (theme: "light" | "dark" | "system") => {
    setForm((f) => ({ ...f, theme }));
    setTheme(theme);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettingsAction({
        name: form.name,
        language: form.language,
        dailyGoal: form.dailyGoal,
        englishLevel: (form.englishLevel as never) ?? undefined,
        chineseLevel: (form.chineseLevel as never) ?? undefined,
        theme: form.theme,
        soundEnabled: form.soundEnabled,
        ttsRate: form.ttsRate,
        notifyReviews: form.notifyReviews,
        notifyStreak: form.notifyStreak,
        notifyAchievements: form.notifyAchievements,
      });
      toast.success("Đã lưu cài đặt ✅");
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpenCheck className="size-4 text-primary" /> Hồ sơ & học tập
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            Tên hiển thị
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required minLength={2} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Email
            <Input value={form.email} readOnly disabled className="opacity-70" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Ngôn ngữ học
            <Select value={form.language} onChange={(e) => set("language", e.target.value as SettingsInitial["language"])}>
              {learningLanguages.map((l) => (
                <option key={l} value={l}>
                  {l === "english" ? "🇬🇧 Tiếng Anh" : l === "chinese" ? "🇨🇳 Tiếng Trung" : "🌎 Song ngữ EN + CN"}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Mục tiêu mỗi ngày (từ mới)
            <Select value={String(form.dailyGoal)} onChange={(e) => set("dailyGoal", Number(e.target.value))}>
              {[10, 20, 30, 50, 75, 100].map((n) => (
                <option key={n} value={n}>
                  {n} từ/ngày
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Trình độ tiếng Anh
            <Select
              value={form.englishLevel ?? "none"}
              onChange={(e) => set("englishLevel", e.target.value === "none" ? null : e.target.value)}
            >
              <option value="none">Chưa chọn</option>
              {englishLevels.map((l) => (
                <option key={l} value={l}>
                  {l === "beginner" ? "Bắt đầu" : l === "elementary" ? "Sơ cấp" : l === "intermediate" ? "Trung cấp" : l === "upper_intermediate" ? "Cao trung cấp" : l === "advanced" ? "Nâng cao" : l}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Trình độ tiếng Trung
            <Select
              value={form.chineseLevel ?? "none"}
              onChange={(e) => set("chineseLevel", e.target.value === "none" ? null : e.target.value)}
            >
              <option value="none">Chưa chọn</option>
              {chineseLevels.map((l) => (
                <option key={l} value={l}>
                  HSK {l.replace("hsk", "")}
                </option>
              ))}
            </Select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-primary" /> Giao diện & âm thanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <label className="space-y-1.5 text-sm font-medium">
            Chủ đề
            <Select value={form.theme} onChange={(e) => themeChange(e.target.value as "light" | "dark" | "system")}>
              <option value="light">☀️ Sáng</option>
              <option value="dark">🌙 Tối</option>
              <option value="system">🖥️ Theo hệ thống</option>
            </Select>
          </label>

          <div className="rounded-2xl bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <Volume2 className="size-4 text-primary" /> Phát âm từ vựng
              </label>
              <Switch checked={form.soundEnabled} onCheckedChange={(v) => set("soundEnabled", v)} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Tự động phát âm khi lật thẻ và xem từ. Tốc độ: {form.ttsRate.toFixed(1)}x
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Chậm</span>
                <span>Nhanh</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.6}
                step={0.1}
                value={form.ttsRate}
                onChange={(e) => set("ttsRate", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="size-4 text-primary" /> Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["notifyReviews", "Nhắc ôn tập khi có từ đến hạn"],
              ["notifyStreak", "Nhắc giữ chuỗi ngày khi gần hết ngày"],
              ["notifyAchievements", "Thông báo khi mở khóa thành tích"],
            ] as [keyof SettingsInitial, string][]
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/40 px-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch checked={Boolean(form[key])} onCheckedChange={(v) => set(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-2">
        <Button type="submit" disabled={saving} size="lg" className="gap-2">
          <Save /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}