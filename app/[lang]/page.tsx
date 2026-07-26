import Link from "next/link";
import MapCard from "@/components/MapCard";
import { isMapAnnotated, listMaps, listOtherMaps } from "@/lib/maps";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getDictionary } from "./dictionaries";

export function generateStaticParams() {
  return [{ lang: "zh" }, { lang: "en" }];
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const dict = await getDictionary(lang);

  const maps = listMaps();
  const otherMaps = listOtherMaps();
  const annotatedCount = maps.filter(isMapAnnotated).length;

  return (
    <div className="min-h-full bg-neutral-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)",
        }}
      />

      <main className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-2 font-mono text-xs tracking-[0.3em] text-red-500">{dict.home.kicker}</div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{dict.home.title}</h1>
        <p className="mt-3 max-w-xl text-neutral-400">{dict.home.subtitle}</p>

        <div className="mt-6 flex items-center gap-4 font-mono text-xs text-neutral-500">
          <span>
            {dict.home.mapCountPrefix}
            <span className="text-white">{maps.length}</span>
            {dict.home.mapCountSuffix}
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span>
            {dict.home.annotatedCountLabel} <span className="text-red-400">{annotatedCount}</span>
          </span>
          <span className="h-3 w-px bg-white/15" />
          <Link href={`/${lang}/editor`} className="text-neutral-400 underline-offset-2 hover:text-red-400 hover:underline">
            {dict.home.editorLink}
          </Link>
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-red-500/60 via-white/10 to-transparent" />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {maps.map((map, index) => (
            <MapCard key={map.id} map={map} index={index} annotated={isMapAnnotated(map)} lang={lang} dict={dict.mapCard} />
          ))}
        </div>

        {otherMaps.length > 0 && (
          <>
            <div className="mt-16 flex items-center gap-3">
              <h2 className="font-mono text-xs tracking-[0.3em] text-neutral-500">{dict.home.otherMapsTitle}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <p className="mt-2 text-sm text-neutral-500">{dict.home.otherMapsNote}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {otherMaps.map((map, index) => (
                <MapCard key={map.id} map={map} index={index} annotated={isMapAnnotated(map)} lang={lang} dict={dict.mapCard} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
