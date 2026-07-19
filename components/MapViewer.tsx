"use client";

import MapStage from "@/components/MapStage";
import { COMMON_GADGET_COLOR, DrawingShape, getOperatorColor, OpeningMarker, PlacementMarker, TextLabelMarker, WallLine } from "@/components/mapMarkers";
import { getCommonGadgetIcon } from "@/lib/operators";
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
  const openings = mapData.openings.filter((o) => o.floor === floor.id);
  const textLabels = mapData.textLabels.filter((t) => t.floor === floor.id);
  const commonPlacements = mapData.commonPlacements.filter((p) => p.floor === floor.id);
  const drawings = (mapData.drawings ?? []).filter((d) => d.floor === floor.id);

  const operatorEntries = Object.entries(mapData.operators).filter(
    ([opId]) => !activeOperatorId || opId === activeOperatorId
  );

  return (
    <MapStage floor={floor}>
      {/* 手绘标注垫底,不响应点击,不挡上层标记的交互 */}
      <g style={{ pointerEvents: "none" }}>
        {drawings.map((d) => (
          <DrawingShape key={d.id} drawing={d} />
        ))}
      </g>

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

      {openings.map((opening) => (
        <OpeningMarker
          key={opening.id}
          opening={opening}
          onClick={() => onSelect({ kind: "opening", data: opening })}
        />
      ))}

      {/* 通用道具位不挂在任何干员名下,不受干员筛选影响,一直显示 */}
      {commonPlacements.map((placement) => (
        <PlacementMarker
          key={placement.id}
          placement={placement}
          color={COMMON_GADGET_COLOR}
          icon={getCommonGadgetIcon(placement.gadgetId)}
          onClick={() => onSelect({ kind: "commonPlacement", data: placement })}
        />
      ))}

      {operatorEntries.flatMap(([opId, op]) =>
        op.placements
          .filter((p) => p.floor === floor.id)
          .map((placement) => (
            <PlacementMarker
              key={placement.id}
              placement={placement}
              color={getOperatorColor(opId)}
              icon={op.icon}
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
