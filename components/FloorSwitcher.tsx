"use client";

import type { Floor } from "@/lib/schema";

interface FloorSwitcherProps {
  floors: Floor[];
  activeFloorId: string;
  onChange: (floorId: string) => void;
}

export default function FloorSwitcher({ floors, activeFloorId, onChange }: FloorSwitcherProps) {
  return (
    <div className="flex gap-1 rounded-full bg-white/90 p-1 shadow-md backdrop-blur dark:bg-neutral-900/90">
      {floors.map((floor) => {
        const active = floor.id === activeFloorId;
        return (
          <button
            key={floor.id}
            onClick={() => onChange(floor.id)}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
            ].join(" ")}
          >
            {floor.name}
          </button>
        );
      })}
    </div>
  );
}
