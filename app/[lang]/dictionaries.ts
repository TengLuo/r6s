import "server-only";
import type { Locale } from "@/lib/i18n";

const dictionaries = {
  zh: () => import("@/dictionaries/zh.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["zh"]>>;

export const getDictionary = (locale: Locale) => dictionaries[locale]();
