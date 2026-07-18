"use client";

import Image from "next/image";
import { OPENING_PURPOSE_LABEL, type SelectedMarker } from "@/lib/schema";

interface MarkerDetailProps {
  marker: SelectedMarker | null;
  onClose: () => void;
}

export default function MarkerDetail({ marker, onClose }: MarkerDetailProps) {
  const open = marker !== null;

  return (
    <div
      aria-hidden={!open}
      className={[
        "fixed z-40 bg-white dark:bg-neutral-900 shadow-xl transition-transform duration-200 ease-out",
        "inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl border-t border-neutral-200 dark:border-neutral-800",
        "md:inset-x-auto md:right-0 md:top-16 md:bottom-0 md:w-96 md:max-h-none md:rounded-none md:border-t-0 md:border-l",
        open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full",
      ].join(" ")}
    >
      {marker && (
        <div className="flex h-full flex-col overflow-y-auto p-5">
          <button
            onClick={onClose}
            className="self-end text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            关闭 ✕
          </button>
          <MarkerBody marker={marker} />
        </div>
      )}
    </div>
  );
}

function MarkerBody({ marker }: { marker: SelectedMarker }) {
  switch (marker.kind) {
    case "wall": {
      const wall = marker.data;
      return (
        <div className="space-y-2">
          <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            墙体
          </span>
          <h2 className="text-lg font-semibold">封墙</h2>
          {wall.note && <p className="text-sm text-neutral-600 dark:text-neutral-400">{wall.note}</p>}
        </div>
      );
    }
    case "opening": {
      const opening = marker.data;
      return (
        <div className="space-y-2">
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            洞口
          </span>
          <h2 className="text-lg font-semibold">{OPENING_PURPOSE_LABEL[opening.purpose]}</h2>
          {opening.connectsTo && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">通向:{opening.connectsTo}</p>
          )}
          {opening.note && <p className="text-sm text-neutral-600 dark:text-neutral-400">{opening.note}</p>}
        </div>
      );
    }
    case "textLabel": {
      const label = marker.data;
      return (
        <div className="space-y-2">
          <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            房间标注
          </span>
          <h2 className="text-lg font-semibold">{label.text}</h2>
        </div>
      );
    }
    case "placement": {
      const { data: placement, operatorName } = marker;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              {operatorName}
            </span>
            <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {placement.tier === "core" ? "核心位" : "备用位"}
            </span>
          </div>
          <h2 className="text-lg font-semibold">{placement.title}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{placement.description}</p>
          {placement.screenshot && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={placement.screenshot}
                alt={placement.title}
                fill
                sizes="(min-width: 768px) 24rem, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      );
    }
    case "commonPlacement": {
      const placement = marker.data;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              通用道具
            </span>
            <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {placement.tier === "core" ? "核心位" : "备用位"}
            </span>
          </div>
          <h2 className="text-lg font-semibold">{placement.title}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{placement.description}</p>
          {placement.screenshot && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={placement.screenshot}
                alt={placement.title}
                fill
                sizes="(min-width: 768px) 24rem, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      );
    }
  }
}
