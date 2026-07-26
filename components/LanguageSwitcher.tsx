"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const LABEL: Record<Locale, string> = { zh: "中文", en: "EN" };
const OTHER: Record<Locale, Locale> = { zh: "en", en: "zh" };

/** 固定在右上角的语言切换按钮:把当前路径的 /zh|/en 前缀换成另一个,其余路径/query 原样保留 */
export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = OTHER[lang];

  const rest = pathname.replace(/^\/(zh|en)/, "") || "/";
  const query = searchParams.toString();
  const href = `/${target}${rest}${query ? `?${query}` : ""}`;

  return (
    <Link
      href={href}
      onClick={() => {
        document.cookie = `NEXT_LOCALE=${target};path=/;max-age=31536000`;
      }}
      className="fixed right-3 top-3 z-50 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-medium text-white shadow backdrop-blur transition-colors hover:bg-black/80"
    >
      {LABEL[target]}
    </Link>
  );
}
