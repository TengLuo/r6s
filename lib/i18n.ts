/**
 * 轻量的中/英取值工具,不带 "server-only" 限制,客户端组件(如 MapEditor)也能直接引入。
 * 真正的大段 UI 文案字典走 app/[lang]/dictionaries.ts(仅服务端加载后往下传)。
 */

export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];

export const DEFAULT_LOCALE: Locale = "zh";

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** en 没填就退回 zh,用来处理"英文翻译还没补"的情况 */
export function pick(zh: string, en: string | undefined, lang: Locale): string {
  return lang === "en" && en ? en : zh;
}
