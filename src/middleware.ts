import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/learn",
  "/review",
  "/practice",
  "/dictionary",
  "/vocabulary",
  "/topics",
  "/statistics",
  "/achievements",
  "/settings",
  "/onboarding",
  "/ai-tutor",
  "/ai-import",
];

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  let isAuthenticated = false;
  try {
    const { getToken } = await import("next-auth/jwt");
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    isAuthenticated = Boolean(token);
  } catch (error) {
    console.error("[middleware] token check failed:", error);
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp|txt)).*)"],
};
