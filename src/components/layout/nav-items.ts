import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Dumbbell,
  Search,
  LibraryBig,
  Layers,
  BarChart3,
  Trophy,
  Settings,
  Sparkles,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Học từ vựng", icon: BookOpen },
  { href: "/review", label: "Ôn tập", icon: Brain },
  { href: "/practice", label: "Luyện tập", icon: Dumbbell },
  { href: "/dictionary", label: "Tra từ", icon: Search },
  { href: "/vocabulary", label: "Từ vựng của tôi", icon: LibraryBig },
  { href: "/topics", label: "Chủ đề", icon: Layers },
  { href: "/statistics", label: "Thống kê", icon: BarChart3 },
];

export const miscNav: NavItem[] = [
  { href: "/achievements", label: "Thành tích", icon: Trophy },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export const aiNav: NavItem[] = [
  { href: "/ai-tutor", label: "AI Tutor", icon: Sparkles },
  { href: "/ai-import", label: "AI phân tích đoạn văn", icon: FileText },
];

export const languageFlags: Record<string, string> = {
  english: "🇬🇧",
  chinese: "🇨🇳",
  both: "🌎",
};

export const languageLabels: Record<string, string> = {
  english: "Tiếng Anh",
  chinese: "Tiếng Trung",
  both: "Cả hai",
};

export function getLanguageLabel(value: string | undefined | null): string {
  return languageLabels[value ?? "both"] ?? "Cả hai";
}

export function getLanguageFlag(value: string | undefined | null): string {
  return languageFlags[value ?? "both"] ?? "🌎";
}