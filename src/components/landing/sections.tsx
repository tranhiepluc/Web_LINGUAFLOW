import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Dumbbell,
  Flame,
  Languages,
  LayoutDashboard,
  Search,
  Sparkles,
  Trophy,
  BarChart3,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function LandingHeader() {
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">LF</span>
        <span className="text-lg font-bold tracking-tight">
          LINGUA<span className="text-primary">FLOW</span>
        </span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
        <Link href="#features" className="hover:text-foreground">Tính năng</Link>
        <Link href="#method" className="hover:text-foreground">Phương pháp</Link>
        <Link href="#stats" className="hover:text-foreground">Thành quả</Link>
        <Link href="#faq" className="hover:text-foreground">FAQ</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/login" className={cn("px-3 py-2 text-sm font-medium text-foreground hover:underline")}>
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          Bắt đầu miễn phí
        </Link>
      </div>
    </header>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 size-[520px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-40 size-[420px] rounded-full bg-success/10 blur-3xl" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:gap-14">
        <div className="relative z-10 max-w-xl flex-1 space-y-6 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Languages className="size-3.5" />
            Tiếng Anh · Tiếng Trung
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Học từ vựng.
            <br />
            Ghi nhớ <span className="text-primary">lâu hơn</span>.
            <br />
            Sử dụng <span className="text-primary">tự nhiên hơn</span>.
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground lg:mx-0">
            LINGUAFLOW kết hợp flashcard, ôn tập thông minh (SM-2), luyện tập thực chiến và AI Tutor để bạn
            chinh phục từ vựng mỗi ngày.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Bắt đầu học ngay <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-input bg-card px-6 text-base font-semibold transition-colors hover:bg-secondary/60"
            >
              <LayoutDashboard className="size-4" />
              Dùng thử demo
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Miễn phí đăng ký
            </div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              7 dạng bài tập
            </div>
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-primary" />
              Ôn tập SM-2
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md flex-1">
          <div className="gradient-card relative space-y-4 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Học từ hôm nay 🎯</p>
                <p className="text-xs text-muted-foreground">Mục tiêu: 10 từ mới</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">🔥 Streak 7</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[70%] rounded-full bg-primary" />
            </div>
            <div className="rounded-2xl border border-border bg-card/80 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-2xl">🇬🇧</span>
                <div>
                  <p className="text-xl font-bold">wander</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">/ˈwɒndə(r)/ · động từ</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Đi lang thang, đi dạo. <span className="text-foreground">I love to wander around old towns.</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-secondary/60 p-3 text-center">
                <p className="text-lg font-bold">208+</p>
                <p className="text-[11px] text-muted-foreground">Từ vựng có sẵn</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3 text-center">
                <p className="text-lg font-bold">20</p>
                <p className="text-[11px] text-muted-foreground">Chủ đề học tập</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  gradient?: string;
}

const FEATURES: FeatureCardProps[] = [
  { icon: BookOpen, title: "Flashcard thông minh", desc: "Học từ mới kèm phiên âm, nghĩa tiếng Việt, ví dụ và phát âm chuẩn.", gradient: "from-teal-500/15" },
  { icon: Brain, title: "Ôn tập SM-2", desc: "Thuật toán lặp lại ngắt quãng giúp bạn ghi nhớ tới 90% sau 3 tuần.", gradient: "from-violet-500/15" },
  { icon: Dumbbell, title: "7 dạng luyện tập", desc: "Từ trắc nghiệm, nghe chọn đến viết chính tả — luôn có thử thách phù hợp.", gradient: "from-amber-500/15" },
  { icon: Search, title: "Tra từ 2 chiều", desc: "Tra Anh–Việt, Trung–Việt tức thì cùng ví dụ, cách dùng và từ liên quan.", gradient: "from-sky-500/15" },
  { icon: Trophy, title: "Gamification", desc: "XP, cấp độ, streak và 12 huy hiệu thành tích giúp bạn duy trì động lực.", gradient: "from-rose-500/15" },
  { icon: Sparkles, title: "AI Tutor", desc: "Hỏi bất kỳ từ nào, AI giải thích nghĩa, cách dùng, từ đồng nghĩa bằng tiếng Việt.", gradient: "from-emerald-500/15" },
];

export function LandingFeatures() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 space-y-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Mọi thứ bạn cần để ghi nhớ từ vựng</h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Từ khám phá đến luyện tập, LINGUAFLOW đưa bạn qua vòng lặp học tập hoàn chỉnh mỗi ngày.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
            <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60", f.gradient)} />
            <div className="relative z-10">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: BookOpen, title: "1. Khám phá", desc: "Học từ mới theo chủ đề hoặc tra từ điển 2 ngôn ngữ." },
  { icon: Brain, title: "2. Ghi nhớ", desc: "Flashcard kèm phát âm và ví dụ, ôn tập đúng lúc theo SM-2." },
  { icon: Dumbbell, title: "3. Luyện tập", desc: "7 dạng bài tập tăng dần giúp vận dụng từ vào ngữ cảnh thực." },
  { icon: BarChart3, title: "4. Theo dõi", desc: "Thống kê tiến độ, chuỗi ngày và thành tích mỗi lần học." },
];

export function LandingMethod() {
  return (
    <section id="method" className="border-y border-border bg-secondary/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Vòng lặp học tập khoa học</h2>
          <p className="text-muted-foreground">
            Học từ vựng hiệu quả không phải học nhồi nhét, mà là ôn lại đúng thời điểm để não bộ ghi nhớ sâu.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.title} className="relative rounded-3xl border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "2.000+", label: "Người học mỗi ngày" },
  { value: "16 nghìn", label: "Từ đã ghi nhớ" },
  { value: "9 ngày", label: "Streak trung bình" },
  { value: "4.9/5", label: "Đánh giá người dùng" },
];

export function LandingStats() {
  return (
    <section id="stats" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="gradient-card grid gap-6 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Minh Anh", role: "Sinh viên · Học tiếng Anh", content: "Streak 60 ngày liên tiếp! Ôn tập SM-2 đúng là thay đổi cách mình ghi nhớ từ vựng hoàn toàn." },
  { name: "Linh", role: "Nhân viên văn phòng · HSK4", content: "Mình học tiếng Trung mà không biết bắt đầu từ đâu, AI Tutor giải thích mọi từ rất dễ hiểu." },
  { name: "Đức Anh", role: "Lập trình viên", content: "7 dạng bài tập đa dạng, không nhàm chán. Đặc biệt mục luyện viết chính tả rất hiệu quả." },
];

export function LandingTestimonials() {
  return (
    <section className="bg-secondary/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Người học nói gì về LINGUAFLOW?</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-3xl border border-border bg-card p-6">
              <div className="mb-3 text-primary">★★★★★</div>
              <blockquote className="text-sm leading-relaxed">&ldquo;{t.content}&rdquo;</blockquote>
              <figcaption className="mt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "LINGUAFLOW miễn phí không?", a: "Có, bạn có thể tạo tài khoản miễn phí và sử dụng toàn bộ tính năng với 208 từ vựng mẫu (104 tiếng Anh, 104 tiếng Trung) và 20 chủ đề." },
  { q: "Tôi nên học bao nhiêu từ mỗi ngày?", a: "Hãy bắt đầu với 10 từ/ngày. Quan trọng hơn là ôn tập đều đặn mỗi ngày để giữ streak và duy trì thói quen." },
  { q: "Ôn tập SM-2 là gì?", a: "Đó là thuật toán lặp lại ngắt quãng: từ bạn học sẽ được nhắc lại đúng trước thời điểm não bộ quên — sau 1, 3, 7, 14, 30 ngày... để ghi nhớ lâu bền." },
  { q: "LINGUAFLOW có dùng được trên điện thoại không?", a: "Có, giao diện thích ứng hoàn toàn với mobile với thanh điều hướng dưới cùng, bạn có thể học mọi lúc mọi nơi." },
];

export function LandingFaq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">Câu hỏi thường gặp</h2>
      <div className="space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:border-primary/30">
            <summary className="cursor-pointer list-none font-semibold transition-colors group-open:text-primary">
              <span className="flex items-center justify-between gap-4">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">＋</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="mx-auto max-w-5xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-[#066542] to-primary p-10 text-center text-white sm:p-16">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/15">
          <Flame className="size-7" />
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Bắt đầu học ống ngay hôm nay</h2>
        <p className="mx-auto mt-3 max-w-md text-white/80">
          Miễn phí đăng ký. Không cần thẻ tín dụng. Duy trì thói quen chỉ cần 10 phút mỗi ngày.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Tạo tài khoản miễn phí <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/60 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-white">LF</span>
            <span className="text-lg font-bold tracking-tight">
              LINGUA<span className="text-primary">FLOW</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Đăng nhập</Link>
            <Link href="/register" className="hover:text-foreground">Đăng ký</Link>
            <Link href="#" className="hover:text-foreground">Điều khoản</Link>
            <Link href="#" className="hover:text-foreground">Bảo mật</Link>
            <Link href="mailto:hello@linguaflow.app" className="hover:text-foreground">Liên hệ</Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LINGUAFLOW. Học từ vựng. Ghi nhớ lâu hơn. Sử dụng tự nhiên hơn.
        </p>
      </div>
    </footer>
  );
}

export function TopicPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary">
      {label}
    </span>
  );
}