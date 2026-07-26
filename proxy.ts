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
  // 排除所有静态资源(/maps、/ops、/gadgets、/shots、根目录的 svg 等 public/ 下的文件)
  // 和 _next 内部资源 —— 用"路径里带不带文件扩展名"统一判断,而不是一个个列目录名,
  // 不然以后随手在 public/ 下新建个目录放素材,又会重蹈覆辙:请求被错误地重定向到
  // /zh/xxx.png 这种不存在的路径,导致图裂。
  matcher: ["/((?!_next|.*\\..*).*)"],
};
