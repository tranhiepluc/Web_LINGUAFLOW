"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, miscNav, aiNav, type NavItem } from "./nav-items";
import { XPProgress } from "@/components/gamification/xp-progress";
import { Avatar } from "@/components/ui/avatar";

export interface SidebarUser {
  name: string | null;
  email: string | null;
  image: string | null;
  xp: number;
  level: number;
  streak: number;
}

function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu chính">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)_/_0.15)]"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-[18px] transition-transform group-hover:scale-110", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-border bg-card/60 lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white font-bold">
            LF
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            LINGUA<span className="text-primary">FLOW</span>
          </span>
        </Link>
      </div>

      <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <NavLinks items={mainNav} />

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Cá nhân
          </p>
          <NavLinks items={miscNav} />
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            AI
          </p>
          <NavLinks items={aiNav} />
        </div>
      </div>

      <div className="border-t border-border p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar name={user.name} src={user.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name ?? "Người học"}</p>
            <p className="text-xs text-muted-foreground">🔥 {user.streak} ngày · Cấp {user.level}</p>
          </div>
        </Link>
        <div className="mt-2 px-2">
          <XPProgress xp={user.xp} level={user.level} compact />
        </div>
      </div>
    </aside>
  );
}