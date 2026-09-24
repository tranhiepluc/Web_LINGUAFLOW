import type { ReactNode } from "react";
import { BookOpen, SearchX, AlertTriangle, Inbox, PartyPopper } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS = {
  empty: Inbox,
  search: SearchX,
  error: AlertTriangle,
  success: PartyPopper,
  book: BookOpen,
};

export interface EmptyStateProps {
  icon?: keyof typeof ICONS;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = "empty", title, description, children, className }: EmptyStateProps) {
  const Icon = ICONS[icon];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function CalloutButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={buttonVariants({ variant: "soft", size: "sm" })}>
      {children}
    </a>
  );
}

export function ErrorState({
  title = "Đã có lỗi xảy ra",
  description = "Không thể tải dữ liệu. Vui lòng thử lại sau.",
  retry,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
}) {
  return (
    <EmptyState icon="error" title={title} description={description}>
      {retry && (
        <Button size="sm" onClick={retry}>
          Thử lại
        </Button>
      )}
    </EmptyState>
  );
}