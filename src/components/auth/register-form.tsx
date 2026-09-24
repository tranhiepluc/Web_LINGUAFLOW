"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { loginSchema, registerSchema, type RegisterInput } from "@/lib/validations";
import { registerAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";
import { GoogleIcon } from "@/components/auth/icons";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    language: "both",
    goalDaily: 10,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof RegisterInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Thông tin không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await registerAction(parsed.data);
      const res = await signIn("credentials", {
        email: parsed.data.email.trim().toLowerCase(),
        password: parsed.data.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Không thể đăng nhập sau khi tạo tài khoản, vui lòng đăng nhập thủ công");
        router.push("/login");
        return;
      }
      toast.success("Tài khoản đã được tạo!");
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(toVietnameseMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <Button variant="outline" type="button" className="w-full" onClick={() => signIn("google")}>
            <GoogleIcon />
            Tiếp tục với Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Hoặc
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Họ và tên</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự, có chữ số"
            value={form.password}
            onChange={(e) => onChange("password", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Mật khẩu cần tối thiểu 6 ký tự và có ít nhất 1 chữ số.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="language">Ngôn ngữ học</Label>
            <Select
              id="language"
              value={form.language}
              onChange={(e) => onChange("language", e.target.value)}
            >
              <option value="english">Tiếng Anh</option>
              <option value="chinese">Tiếng Trung</option>
              <option value="both">Cả hai</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goalDaily">Mục tiêu từ/ngày</Label>
            <Select
              id="goalDaily"
              value={String(form.goalDaily)}
              onChange={(e) => onChange("goalDaily", Number(e.target.value))}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={String(n)}>
                  {n} từ/ngày
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Bằng việc đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của LINGUAFLOW.
      </p>
    </div>
  );
}

export function validateRegisterFields(form: RegisterInput): string | null {
  const parsed = loginSchema.safeParse({ email: form.email, password: form.password });
  return parsed.success ? null : (parsed.error.errors[0]?.message ?? "Thông tin không hợp lệ");
}