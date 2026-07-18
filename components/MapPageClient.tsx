"use client";

import { useState } from "react";
import Link from "next/link";
import MapViewer from "@/components/MapViewer";
import FloorSwitcher from "@/components/FloorSwitcher";
import MarkerDetail from "@/components/MarkerDetail";
import OperatorFilter from "@/components/OperatorFilter";
import { isMapAnnotated } from "@/lib/maps";
import type { MapData, SelectedMarker } from "@/lib/schema";

export default function MapPageClient({ mapData }: { mapData: MapData }) {
  const [activeFloorId, setActiveFloorId] = useState(mapData.floors[0].id);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(null);

  const floor = mapData.floors.find((f) => f.id === activeFloorId) ?? mapData.floors[0];
  const annotated = isMapAnnotated(mapData);
  const highlightWallId =
    selectedMarker?.kind === "placement" || selectedMarker?.kind === "commonPlacement"
      ? selectedMarker.data.requiresWall ?? null
      : null;

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
            ← 地图列表
          </Link>
          <h1 className="text-lg font-semibold">{mapData.name}</h1>
        </div>
        <FloorSwitcher
          floors={mapData.floors}
          activeFloorId={activeFloorId}
          onChange={(id) => {
            setActiveFloorId(id);
            setSelectedMarker(null);
          }}
        />
      </header>

      <div className="shrink-0 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <OperatorFilter mapData={mapData} activeOperatorId={activeOperatorId} onChange={setActiveOperatorId} />
      </div>

      <main className="relative min-h-0 flex-1 bg-neutral-100 dark:bg-neutral-950">
        {!annotated && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
            <div className="pointer-events-auto rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 shadow dark:bg-amber-950 dark:text-amber-300">
              该地图攻略正在制作中,当前仅为占位底图
            </div>
          </div>
        )}
        <MapViewer
          mapData={mapData}
          floor={floor}
          activeOperatorId={activeOperatorId}
          highlightWallId={highlightWallId}
          onSelect={setSelectedMarker}
        />
      </main>

      <MarkerDetail marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
    </div>
  );
}
