import { Flame } from "lucide-react";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface XPProgressProps {
  xp: number;
  level: number;
  compact?: boolean;
  streak?: number;
  className?: string;
}

export function XPProgress({ xp, compact = false, streak, className }: XPProgressProps) {
  const progress = levelProgress(xp);
  const title = levelTitle(progress.level);

  return (
    <div className={cn("space-y-1.5", className)}>
      {!compact && (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold">
              Cấp {progress.level} · {title}
            </p>
            <p className="text-xs text-muted-foreground">
              {progress.currentXp} XP · Còn {progress.xpToNext} XP lên cấp {progress.level + 1}
            </p>
          </div>
          {typeof streak === "number" && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
              <Flame className="size-3.5" />
              {streak} ngày
            </span>
          )}
        </div>
      )}
      <Progress value={progress.percent} className={cn(compact ? "h-1.5" : "h-2.5")} />
    </div>
  );
}