import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MapPageClient from "@/components/MapPageClient";
import { getMapData, getMapName, listMaps, listOtherMaps } from "@/lib/maps";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getDictionary } from "../../dictionaries";

export function generateStaticParams() {
  return [...listMaps(), ...listOtherMaps()].map((map) => ({ mapId: map.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; mapId: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, mapId } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const dict = await getDictionary(lang);
  const mapData = getMapData(mapId);
  return { title: mapData ? `${getMapName(mapData, lang)}${dict.meta.mapTitleSuffix}` : dict.meta.mapNotFound };
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ lang: string; mapId: string }>;
}) {
  const { lang: rawLang, mapId } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const mapData = getMapData(mapId);
  if (!mapData) notFound();
  const dict = await getDictionary(lang);

  return <MapPageClient mapData={mapData} lang={lang} dict={dict} />;
}
