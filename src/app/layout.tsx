import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "LINGUAFLOW - Học từ vựng tiếng Anh & tiếng Trung",
    template: "%s | LINGUAFLOW",
  },
  description:
    "Học từ vựng tiếng Anh và tiếng Trung qua flashcard, luyện tập và ôn tập cách quãng (spaced repetition). Ghi nhớ lâu hơn, sử dụng tự nhiên hơn.",
  keywords: [
    "học từ vựng",
    "tiếng Anh",
    "tiếng Trung",
    "pinyin",
    "flashcard",
    "spaced repetition",
    "HSK",
    "IELTS",
  ],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "LINGUAFLOW - Học từ vựng thông minh",
    description: "Học từ vựng. Ghi nhớ lâu hơn. Sử dụng tự nhiên hơn.",
    url: APP_URL,
    siteName: "LINGUAFLOW",
    locale: "vi_VN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F867B" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f1d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={cn("font-sans", inter.variable)}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}