"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Dumbbell, Search, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { mainNav, miscNav, aiNav } from "./nav-items";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/learn", label: "Học", icon: BookOpen },
  { href: "/practice", label: "Luyện tập", icon: Dumbbell },
  { href: "/dictionary", label: "Tra từ", icon: Search },
];

const GROUPS = [
  { title: "Menu chính", items: mainNav },
  { title: "Cá nhân", items: miscNav },
  { title: "AI", items: aiNav },
];

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Điều hướng di động"
      >
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium focus-visible:outline-none",
            "text-muted-foreground",
          )}
        >
          <Menu className="size-5" />
          Thêm
        </button>
      </nav>

      <Dialog open={open} onOpenChange={onClose} className="p-0">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Avatar name={session?.user?.name} src={session?.user?.image} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session?.user?.name ?? "Người học"}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
        <div className="scrollbar-thin max-h-[70vh] divide-y divide-border overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.title} className="space-y-0.5 p-3">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/70",
                    )}
                  >
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </Dialog>
    </>
  );
}