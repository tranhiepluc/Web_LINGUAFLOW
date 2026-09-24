import type { Metadata } from "next";
import {
  LandingHeader,
  LandingHero,
  LandingFeatures,
  LandingMethod,
  LandingStats,
  LandingTestimonials,
  LandingFaq,
  LandingCta,
  LandingFooter,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "LINGUAFLOW — Học từ vựng. Ghi nhớ lâu hơn. Sử dụng tự nhiên hơn.",
  description:
    "Nền tảng học từ vựng tiếng Anh và tiếng Trung với flashcard thông minh, ôn tập SM-2, 7 dạng luyện tập, AI Tutor và gamification.",
  keywords: ["học từ vựng", "tiếng Anh", "tiếng Trung", "flashcard", "spaced repetition", "LINGUAFLOW"],
  openGraph: {
    title: "LINGUAFLOW — Học từ vựng thông minh",
    description: "Học từ vựng. Ghi nhớ lâu hơn. Sử dụng tự nhiên hơn.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingMethod />
        <LandingStats />
        <LandingTestimonials />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}