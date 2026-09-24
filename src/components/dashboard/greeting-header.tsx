"use client";

import { CalendarDays, Clock } from "lucide-react";
import { getLanguageFlag, getLanguageLabel } from "@/components/layout/nav-items";

export function GreetingHeader({
  name,
  streak,
  language,
}: {
  name: string | null;
  streak: number;
  language?: string | null;
}) {
  const date = new Date();
  const hour = date.getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi trưa/chiều" : "Chào buổi tối";

  const weekday = date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting}, {name?.split(" ").pop() ?? "bạn"} 👋
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {weekday}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1.5">
            {getLanguageFlag(language ?? "both")}
            Học: {getLanguageLabel(language ?? "both")}
          </span>
        </div>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5 rounded-2xl bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-600 dark:text-orange-400">
          <span className="text-lg">🔥</span> {streak} ngày liên tiếp
        </div>
      )}
    </div>
  );
}