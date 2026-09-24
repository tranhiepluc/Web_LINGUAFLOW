import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Brain, Dumbbell, Sparkles, Users, Flame } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[#066542] to-background p-10 lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white">
            LF
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            LINGUA<span className="text-white/70">FLOW</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-bold leading-snug text-white">
              Học từ vựng.
              <br />
              Ghi nhớ lâu hơn.
              <br />
              Sử dụng tự nhiên hơn.
            </h1>
            <p className="mt-4 text-white/80">
              LINGUAFLOW giúp bạn học tiếng Anh & tiếng Trung qua flashcard, ôn tập thông minh (SM-2) và luyện tập thực chiến.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Feature icon={BookOpen} title="Flashcard" text="Học từ mới mỗi ngày" />
            <Feature icon={Brain} title="Ôn tập thông minh" text="SF theo lịch trình SM-2" />
            <Feature icon={Dumbbell} title="7 dạng bài tập" text="Từ lựa chọn đến viết câu" />
            <Feature icon={Sparkles} title="AI Tutor" text="Giải thích mọi từ ngữ" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/70">
          <div className="flex items-center gap-2 text-sm">
            <Users className="size-4" />
            2,000+ người học mỗi ngày
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Flame className="size-4" />
            Streak trung bình 9 ngày
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof BookOpen; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
      <Icon className="size-4.5 text-white" />
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-white/70">{text}</p>
    </div>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 space-y-2">
      <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-white">
          LF
        </span>
        <span className="text-lg font-bold tracking-tight">
          LINGUA<span className="text-primary">FLOW</span>
        </span>
      </Link>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}