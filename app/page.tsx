import Link from "next/link";
import MapCard from "@/components/MapCard";
import { isMapAnnotated, listMaps } from "@/lib/maps";

export default function Home() {
  const maps = listMaps();
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
        <div className="mb-2 font-mono text-xs tracking-[0.3em] text-red-500">
          OPERATION DATABASE // RANKED
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          R6 Siege 排位地图攻略
        </h1>
        <p className="mt-3 max-w-xl text-neutral-400">
          选一张图,30 秒看懂怎么防。封墙、打洞、道具位一目了然,新手也能秒懂装修。
        </p>

        <div className="mt-6 flex items-center gap-4 font-mono text-xs text-neutral-500">
          <span>
            共 <span className="text-white">{maps.length}</span> 张排位地图
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span>
            已收录攻略 <span className="text-red-400">{annotatedCount}</span>
          </span>
          <span className="h-3 w-px bg-white/15" />
          <Link href="/editor" className="text-neutral-400 underline-offset-2 hover:text-red-400 hover:underline">
            标注编辑器 →
          </Link>
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-red-500/60 via-white/10 to-transparent" />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {maps.map((map, index) => (
            <MapCard key={map.id} map={map} index={index} annotated={isMapAnnotated(map)} />
          ))}
        </div>
      </main>
    </div>
  );
}
