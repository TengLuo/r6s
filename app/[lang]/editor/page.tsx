import type { Metadata } from "next";
import MapEditor from "@/components/MapEditor";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";

export function generateStaticParams() {
  return [{ lang: "zh" }, { lang: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const dict = await getDictionary(lang);
  return { title: dict.meta.editorTitle };
}

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ map?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { map } = await searchParams;
  const dict = await getDictionary(lang);
  return <MapEditor initialMapId={map} lang={lang} dict={dict} />;
}
