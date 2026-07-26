import Link from "next/link";
import MapCard from "@/components/MapCard";
import { isMapAnnotated, listMaps, listOtherMaps } from "@/lib/maps";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getDictionary } from "./dictionaries";

export function generateStaticParams() {
  return [{ lang: "zh" }, { lang: "en" }];
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { mode: rawMode } = await searchParams;
  const mode: "guide" | "edit" = rawMode === "edit" ? "edit" : "guide";
  const dict = await getDictionary(lang);

  const maps = listMaps();
  const otherMaps = listOtherMaps();
  const annotatedCount = maps.filter(isMapAnnotated).length;
  const isEdit = mode === "edit";

  return (
    <div className="min-h-full bg-neutral-950 text-white">
      {/* 顶部色条 + 背景光晕都跟着模式变色,一眼就能分清现在是攻略模式还是编辑模式,
          不用非得盯着 tab 文字看 */}
      <div className={isEdit ? "h-1 w-full bg-amber-500" : "h-1 w-full bg-red-500"} />
      <div
        className="pointer-events-none fixed inset-0 opacity-70 transition-colors duration-300"
        style={{
          background: isEdit
            ? "radial-gradient(900px circle at 15% -10%, rgba(245,158,11,0.16), transparent 60%)"
            : "radial-gradient(900px circle at 15% -10%, rgba(239,68,68,0.16), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)",
        }}
      />

      <main className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <div className={["mb-2 font-mono text-xs tracking-[0.3em]", isEdit ? "text-amber-400" : "text-red-500"].join(" ")}>
          {dict.home.kicker}
        </div>
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
        </div>

        <div className="mt-4 inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-sm font-medium">
          <Link
            href={`/${lang}?mode=guide`}
            className={[
              "rounded-full px-4 py-1.5 transition-colors",
              mode === "guide" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white",
            ].join(" ")}
          >
            {dict.home.modeGuide}
          </Link>
          <Link
            href={`/${lang}?mode=edit`}
            className={[
              "rounded-full px-4 py-1.5 transition-colors",
              mode === "edit" ? "bg-amber-600 text-white" : "text-neutral-400 hover:text-white",
            ].join(" ")}
          >
            {dict.home.modeEdit}
          </Link>
        </div>

        <div
          className={[
            "mt-4 h-px w-full bg-gradient-to-r to-transparent",
            isEdit ? "from-amber-500/60 via-white/10" : "from-red-500/60 via-white/10",
          ].join(" ")}
        />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {maps.map((map, index) => (
            <MapCard key={map.id} map={map} index={index} annotated={isMapAnnotated(map)} lang={lang} mode={mode} dict={dict.mapCard} />
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
                <MapCard key={map.id} map={map} index={index} annotated={isMapAnnotated(map)} lang={lang} mode={mode} dict={dict.mapCard} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
