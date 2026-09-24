"use client";

import { Check, LogOut, Menu, Moon, Palette, Settings, Sparkles, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { SearchInput } from "@/components/ui/search-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { getLanguageFlag, getLanguageLabel } from "./nav-items";
import { getNotificationsAction, updateLanguagePrefAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import type { NotificationItem } from "@/types";

export function Header({ mobileMenuOpen }: { mobileMenuOpen: (open: boolean) => void }) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    getNotificationsAction()
      .then((items) => {
        if (!cancelled) setNotifications(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const language = session?.user?.language ?? "both";

  const changeLanguage = async (lang: "english" | "chinese" | "both") => {
    if (lang === language) return;
    try {
      await updateLanguagePrefAction(lang);
      await update();
      toast.success(`Đã chuyển sang học: ${getLanguageLabel(lang)}`);
      router.refresh();
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    }
  };

  const userName = session?.user?.name || null;
  const userEmail = session?.user?.email || null;
  const userImage = session?.user?.image || null;

  const themes = [
    { value: "light", label: "Sáng" },
    { value: "dark", label: "Tối" },
    { value: "system", label: "Theo hệ thống" },
  ];

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        aria-label="Mở menu"
        onClick={() => mobileMenuOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <div className="hidden max-w-md flex-1 sm:block">
        <SearchInput
          placeholder="Tìm từ, pinyin, nghĩa..."
          size="default"
          className="w-full"
          onSearch={(q) => {
            if (q.trim()) router.push(`/dictionary?q=${encodeURIComponent(q.trim())}`);
          }}
        />
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="ml-auto flex items-center gap-1.5">
        <div className="sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tra từ"
            onClick={() => router.push("/dictionary")}
          >
            <Sparkles className="size-4" />
          </Button>
        </div>

        <Dropdown
          align="end"
          trigger={
            <Button variant="ghost" size="sm" className="hidden text-foreground sm:inline-flex">
              <span className="text-base">{getLanguageFlag(language)}</span>
              <span>{getLanguageLabel(language)}</span>
            </Button>
          }
        >
          <DropdownLabel>Ngôn ngữ đang học</DropdownLabel>
          {[
            { value: "english" as const, label: "🇬🇧 Tiếng Anh" },
            { value: "chinese" as const, label: "🇨🇳 Tiếng Trung" },
            { value: "both" as const, label: "🌎 Cả hai" },
          ].map((opt) => (
            <DropdownItem key={opt.value} onSelect={() => changeLanguage(opt.value)}>
              <span className="flex-1">{opt.label}</span>
              {language === opt.value && <Check className="text-primary" />}
            </DropdownItem>
          ))}
        </Dropdown>

        <Dropdown align="end" trigger={<Button variant="ghost" size="icon" aria-label="Thông báo"><BellIcon /></Button>}>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Không có thông báo mới
            </div>
          ) : (
            <>
              <DropdownLabel>Thông báo</DropdownLabel>
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 rounded-xl px-3 py-2.5">
                  <span className="text-lg">{n.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </Dropdown>

        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Tài khoản"
            >
              <Avatar name={userName} src={userImage} size="sm" />
            </button>
          }
        >
          <DropdownLabel>
            <div className="truncate font-medium text-foreground">{userName ?? "Người học"}</div>
            <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
          </DropdownLabel>
          <DropdownSeparator />
          <DropdownItem onSelect={() => router.push("/settings")}>
            <Settings /> Cài đặt
          </DropdownItem>
          <DropdownItem onSelect={() => router.push("/ai-tutor")}>
            <Sparkles /> AI Tutor
          </DropdownItem>
          <DropdownSeparator />
          <DropdownLabel>Giao diện</DropdownLabel>
          {themes.map((t) => (
            <DropdownItem key={t.value} onSelect={() => setTheme(t.value)}>
              {t.value === "light" ? <Sun /> : t.value === "dark" ? <Moon /> : <Palette />}
              <span className="flex-1">{t.label}</span>
              {theme === t.value && <Check className="text-primary" />}
            </DropdownItem>
          ))}
          <DropdownSeparator />
          <DropdownItem
            onSelect={() => signOut({ callbackUrl: "/login" })}
            className="text-destructive hover:bg-destructive/10"
          >
            <LogOut /> Đăng xuất
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}