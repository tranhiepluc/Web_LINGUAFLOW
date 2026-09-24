import type { Metadata } from "next";
import { AuthHeader } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu · LINGUAFLOW",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <AuthHeader
        title="Đặt lại mật khẩu"
        subtitle="Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."
      />
      <ForgotPasswordForm />
    </div>
  );
}