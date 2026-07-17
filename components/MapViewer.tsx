"use client";

import MapStage from "@/components/MapStage";
import { DEFAULT_OPERATOR_COLOR, OPERATOR_COLOR, PlacementMarker, PointMarker, TextLabelMarker, WallLine } from "@/components/mapMarkers";
import type { Floor, MapData, SelectedMarker } from "@/lib/schema";

interface MapViewerProps {
  mapData: MapData;
  floor: Floor;
  /** 只显示该干员的道具位;为空表示全部显示 */
  activeOperatorId?: string | null;
  /** 需要闪烁高亮的墙体 id(M2 的 requiresWall 联动会用到) */
  highlightWallId?: string | null;
  onSelect: (marker: SelectedMarker) => void;
}

export default function MapViewer({
  mapData,
  floor,
  activeOperatorId,
  highlightWallId,
  onSelect,
}: MapViewerProps) {
  const walls = mapData.walls.filter((w) => w.floor === floor.id);
  const hatches = mapData.hatches.filter((h) => h.floor === floor.id);
  const rotates = mapData.rotates.filter((r) => r.floor === floor.id);
  const textLabels = mapData.textLabels.filter((t) => t.floor === floor.id);

  const operatorEntries = Object.entries(mapData.operators).filter(
    ([opId]) => !activeOperatorId || opId === activeOperatorId
  );

  return (
    <MapStage floor={floor}>
      {textLabels.map((label) => (
        <TextLabelMarker
          key={label.id}
          label={label}
          onClick={() => onSelect({ kind: "textLabel", data: label })}
        />
      ))}

      {walls.map((wall) => (
        <WallLine
          key={wall.id}
          wall={wall}
          highlighted={highlightWallId === wall.id}
          onClick={() => onSelect({ kind: "wall", data: wall })}
        />
      ))}

      {hatches.map((hatch) => (
        <PointMarker
          key={hatch.id}
          x={hatch.pos.x}
          y={hatch.pos.y}
          fill="#9333ea"
          shape="diamond"
          onClick={() => onSelect({ kind: "hatch", data: hatch })}
        />
      ))}

      {rotates.map((rotate) => (
        <PointMarker
          key={rotate.id}
          x={rotate.pos.x}
          y={rotate.pos.y}
          fill="#ea580c"
          shape="triangle"
          onClick={() => onSelect({ kind: "rotate", data: rotate })}
        />
      ))}

      {operatorEntries.flatMap(([opId, op]) =>
        op.placements
          .filter((p) => p.floor === floor.id)
          .map((placement) => (
            <PlacementMarker
              key={placement.id}
              placement={placement}
              color={OPERATOR_COLOR[opId] ?? DEFAULT_OPERATOR_COLOR}
              onClick={() =>
                onSelect({
                  kind: "placement",
                  data: placement,
                  operatorId: opId,
                  operatorName: op.name,
                })
              }
            />
          ))
      )}
    </MapStage>
  );
}
