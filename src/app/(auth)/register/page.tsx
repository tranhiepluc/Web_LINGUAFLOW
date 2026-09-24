import type { Metadata } from "next";
import { isGoogleEnabled } from "@/lib/auth";
import { AuthHeader } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký · LINGUAFLOW",
};

export default function RegisterPage() {
  return (
    <div>
      <AuthHeader
        title="Tạo tài khoản miễn phí ✨"
        subtitle="Bắt đầu học 208 từ vựng có sẵn và xây dựng thư viện của riêng bạn."
      />
      <RegisterForm googleEnabled={isGoogleEnabled} />
    </div>
  );
}