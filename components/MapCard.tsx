import Link from "next/link";
import Image from "next/image";
import type { MapData } from "@/lib/schema";
import { getMapName } from "@/lib/maps";
import type { Locale } from "@/lib/i18n";

interface MapCardProps {
  map: MapData;
  index: number;
  annotated: boolean;
  lang: Locale;
  mode: "guide" | "edit";
  dict: { annotated: string; inProgress: string };
}

export default function MapCard({ map, index, annotated, lang, mode, dict }: MapCardProps) {
  const thumb = map.floors[0]?.image;
  const name = getMapName(map, lang);
  const href = mode === "edit" ? `/${lang}/editor?map=${map.id}` : `/${lang}/map/${map.id}`;

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-lg border border-white/10 bg-neutral-900 transition-colors hover:border-red-500/60"
    >
      <span className="pointer-events-none absolute left-2 top-2 z-10 font-mono text-6xl font-black leading-none text-white/[0.06] transition-colors group-hover:text-red-500/10">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* 四角取景框,hover 时高亮,呼应战术 HUD 观感 */}
      <span className="pointer-events-none absolute left-2 top-2 z-20 h-3 w-3 border-l-2 border-t-2 border-white/20 transition-colors group-hover:border-red-500" />
      <span className="pointer-events-none absolute right-2 top-2 z-20 h-3 w-3 border-r-2 border-t-2 border-white/20 transition-colors group-hover:border-red-500" />
      <span className="pointer-events-none absolute bottom-2 left-2 z-20 h-3 w-3 border-b-2 border-l-2 border-white/20 transition-colors group-hover:border-red-500" />
      <span className="pointer-events-none absolute bottom-2 right-2 z-20 h-3 w-3 border-b-2 border-r-2 border-white/20 transition-colors group-hover:border-red-500" />

      <div className="relative aspect-[10/7] w-full overflow-hidden">
        {thumb && (
          <Image
            src={thumb}
            alt={name}
            fill
            priority={index < 4}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
      </div>

      <div className="relative z-10 -mt-10 px-4 pb-4">
        <span
          className={[
            "inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
            annotated
              ? "bg-red-500/15 text-red-400"
              : "bg-white/10 text-neutral-400",
          ].join(" ")}
        >
          {annotated ? dict.annotated : dict.inProgress}
        </span>
        <h2 className="mt-1.5 truncate text-base font-semibold text-white">{name}</h2>
      </div>
    </Link>
  );
}
