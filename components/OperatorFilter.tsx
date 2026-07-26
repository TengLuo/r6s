"use client";

import { getOperatorColor } from "@/components/mapMarkers";
import OperatorAvatar from "@/components/OperatorAvatar";
import type { MapData } from "@/lib/schema";

interface OperatorFilterProps {
  mapData: MapData;
  activeOperatorId: string | null;
  onChange: (operatorId: string | null) => void;
  dict: { all: string };
}

export default function OperatorFilter({ mapData, activeOperatorId, onChange, dict }: OperatorFilterProps) {
  const operatorIds = Object.keys(mapData.operators);
  if (operatorIds.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2">
      <FilterChip label={dict.all} active={activeOperatorId === null} onClick={() => onChange(null)} />
      {operatorIds.map((id) => {
        const op = mapData.operators[id];
        return (
          <button
            key={id}
            onClick={() => onChange(activeOperatorId === id ? null : id)}
            title={op.name}
            className={[
              "flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-sm font-medium transition-colors",
              activeOperatorId === id
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
            ].join(" ")}
          >
            <OperatorAvatar icon={op.icon} name={op.name} color={getOperatorColor(id)} size={28} />
            {op.name}
          </button>
        );
      })}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
