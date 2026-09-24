import type { Metadata } from "next";
import { isGoogleEnabled } from "@/lib/auth";
import { AuthHeader } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập · LINGUAFLOW",
};

export default function LoginPage() {
  return (
    <div>
      <AuthHeader
        title="Chào mừng trở lại 👋"
        subtitle="Đăng nhập để tiếp tục hành trình chinh phục từ vựng."
      />
      <LoginForm googleEnabled={isGoogleEnabled} />
    </div>
  );
}