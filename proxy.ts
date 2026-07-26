import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["zh", "en"] as const;
const DEFAULT_LOCALE = "zh";
const COOKIE_NAME = "NEXT_LOCALE";

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  if (acceptLanguage.toLowerCase().startsWith("en")) return "en";

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 排除静态地图底图(/maps/...)、_next 内部资源、favicon —— 这些不是页面路由,
  // 加上语言前缀重定向反而会 404。
  matcher: ["/((?!maps|_next|favicon.ico).*)"],
};
