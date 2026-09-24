/**
 * Chuyển lỗi kỹ thuật thành thông báo tiếng Việt thân thiện.
 * Chi tiết kỹ thuật chỉ log phía server.
 */
export function toVietnameseMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (raw.includes("UNAUTHORIZED") || raw.includes("AUTH")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (raw.includes("VALIDATION")) {
    return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  }
  if (raw.includes("NOT_FOUND")) {
    return "Không tìm thấy dữ liệu bạn yêu cầu.";
  }
  if (raw.includes("DUPLICATE")) {
    return "Dữ liệu đã tồn tại.";
  }
  if (raw.includes("RATE_LIMIT")) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.";
  }
  if (raw.includes("NETWORK") || raw.includes("fetch")) {
    return "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }
  if (raw.includes("AI_")) {
    return "Dịch vụ AI đang bận. Vui lòng thử lại sau.";
  }
  if (raw.includes("CredentialsSignin") || raw.includes("credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (raw.includes("AccessDenied")) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function unauthorized(): never {
  throw new Error("UNAUTHORIZED");
}

export function notFound(message = "NOT_FOUND"): never {
  throw new Error(message);
}
