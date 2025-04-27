import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Получаем сессию
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Проверяем cookie
  const isAuthenticatedCookie =
    request.cookies.get("is_authenticated")?.value === "true";

  // Проверяем, авторизован ли пользователь
  const isAuthenticated = session !== null || isAuthenticatedCookie;

  // Защищенные маршруты
  const protectedRoutes = [
    "/dashboard",
    "/transactions",
    "/budgets",
    "/categories",
    "/admin",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Если пользователь не авторизован и пытается получить доступ к защищенному маршруту
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Если пользователь авторизован и пытается получить доступ к странице входа
  if (isAuthenticated && request.nextUrl.pathname === "/") {
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
