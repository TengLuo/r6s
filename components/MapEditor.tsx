"use client";

import { useEffect, useRef, useState } from "react";
import MapStage, { type ImagePoint } from "@/components/MapStage";
import {
  WALL_COLOR,
  COMMON_GADGET_COLOR,
  WallLine,
  OpeningMarker,
  PlacementMarker,
  TextLabelMarker,
  getOperatorColor,
} from "@/components/mapMarkers";
import OperatorAvatar from "@/components/OperatorAvatar";
import { ALL_MAPS, MAPS } from "@/lib/maps";
import {
  COMMON_GADGETS_ATTACK,
  COMMON_GADGETS_DEFEND,
  findGadgetName,
  getGadgetOptions,
  getOperatorInfo,
  getOperatorsByRole,
  type OperatorRole,
} from "@/lib/operators";
import { OPENING_PURPOSE_COLOR, OPENING_PURPOSE_LABEL } from "@/lib/schema";
import type { Floor, MapData, Opening, OpeningPurpose, Placement, PlacementTier, TextLabel, Wall } from "@/lib/schema";

type Tool =
  | "select"
  | "wall"
  | "opening_vault"
  | "opening_walkthrough"
  | "opening_gunfight"
  | "opening_foot"
  | "opening_floor"
  | "textLabel"
  | "placement";

const OPENING_PURPOSES: OpeningPurpose[] = ["vault", "walkthrough", "gunfight", "foot", "floor"];

const TOOL_OPENING_PURPOSE: Partial<Record<Tool, OpeningPurpose>> = {
  opening_vault: "vault",
  opening_walkthrough: "walkthrough",
  opening_gunfight: "gunfight",
  opening_foot: "foot",
  opening_floor: "floor",
};

const TOOLS: { id: Tool; label: string; color?: string }[] = [
  { id: "select", label: "选择 / 拖动" },
  { id: "wall", label: "封墙", color: WALL_COLOR },
  ...OPENING_PURPOSES.map((p) => ({
    id: `opening_${p}` as Tool,
    label: OPENING_PURPOSE_LABEL[p],
    color: OPENING_PURPOSE_COLOR[p],
  })),
  { id: "textLabel", label: "文字标注", color: "#64748b" },
];

type Selection =
  | { kind: "wall"; id: string }
  | { kind: "opening"; id: string }
  | { kind: "textLabel"; id: string }
  | { kind: "commonPlacement"; id: string }
  | { kind: "placement"; operatorId: string; id: string };

type Draft =
  | { kind: "wall"; start: ImagePoint; current: ImagePoint }
  | { kind: "placement"; start: ImagePoint; current: ImagePoint };

type DragTarget =
  | { kind: "wall-endpoint"; id: string; which: 0 | 1 }
  | { kind: "wall-move"; id: string; halfVector: ImagePoint }
  | { kind: "opening" | "textLabel" | "commonPlacement"; id: string }
  | { kind: "placement"; operatorId: string; id: string }
  | { kind: "resize"; target: Selection; center: ImagePoint }
  | { kind: "rotate"; target: Selection; center: ImagePoint };

/** 单个标记的把手到中心的距离,对应 size=1 时的基准值(图片像素单位) */
const RESIZE_HANDLE_BASE_DIST = 40;
/** 旋转把手到中心的距离,固定值,不随 size 缩放,避免图标很大/很小时把手贴太近或飞太远 */
const ROTATE_HANDLE_DIST = 46;

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function angleDeg(from: ImagePoint, to: ImagePoint) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function dist(a: ImagePoint, b: ImagePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function blankMapData(id: string, name: string, floor: Floor): MapData {
  return {
    id,
    name,
    floors: [floor],
    walls: [],
    openings: [],
    textLabels: [],
    operators: {},
    commonPlacements: [],
    presets: [],
  };
}

const REGISTRY_MAP_IDS = Object.keys(ALL_MAPS);

export default function MapEditor() {
  const [mapData, setMapData] = useState<MapData>(() => structuredClone(MAPS["border"]));
  const [activeFloorId, setActiveFloorId] = useState(mapData.floors[0].id);
  const [tool, setTool] = useState<Tool>("select");
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(
    Object.keys(mapData.operators)[0] ?? null
  );
  const [activeGadgetId, setActiveGadgetId] = useState<string | null>(
    getOperatorInfo(Object.keys(mapData.operators)[0] ?? "")?.gadget?.id ?? null
  );
  const [operatorRoleTab, setOperatorRoleTab] = useState<OperatorRole>("defend");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [history, setHistory] = useState<MapData[]>([]);
  const [newOperatorId, setNewOperatorId] = useState("");
  const [newOperatorName, setNewOperatorName] = useState("");
  const [imagePathHints, setImagePathHints] = useState<Record<string, string>>({});
  const [iconScale, setIconScale] = useState(1);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [newFloorId, setNewFloorId] = useState("");
  const [newFloorName, setNewFloorName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const addFloorInputRef = useRef<HTMLInputElement>(null);

  const floor = mapData.floors.find((f) => f.id === activeFloorId) ?? mapData.floors[0];

  function snapshotHistory() {
    setHistory((h) => [...h.slice(-49), mapData]);
  }

  function commit(newData: MapData) {
    snapshotHistory();
    setMapData(newData);
  }

  function patch(updater: (md: MapData) => MapData) {
    setMapData(updater);
  }

  function undo() {
    if (history.length === 0) return;
    setMapData(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }

  function switchFloor(id: string) {
    setActiveFloorId(id);
    setSelection(null);
    setDraft(null);
    setDragTarget(null);
  }

  function loadRegistryMap(id: string) {
    const data = ALL_MAPS[id];
    if (!data) return;
    setMapData(structuredClone(data));
    setActiveFloorId(data.floors[0].id);
    setActiveOperatorId(Object.keys(data.operators)[0] ?? null);
    setActiveGadgetId(getOperatorInfo(Object.keys(data.operators)[0] ?? "")?.gadget?.id ?? null);
    setSelection(null);
    setDraft(null);
    setDragTarget(null);
    setHistory([]);
    setImagePathHints({});
  }

  function loadCustomImage(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const id = "custom";
      const newFloor: Floor = {
        id: "1f",
        name: "1F",
        image: url,
        imageSize: { width: img.naturalWidth, height: img.naturalHeight },
      };
      setMapData(blankMapData(id, "自定义底图", newFloor));
      setActiveFloorId("1f");
      setActiveOperatorId(null);
      setActiveGadgetId(null);
      setSelection(null);
      setDraft(null);
      setDragTarget(null);
      setHistory([]);
      setImagePathHints({ "1f": `/maps/${id}/1f.${file.name.split(".").pop() ?? "png"}` });
    };
    img.src = url;
  }

  function addFloor(file: File) {
    const id = newFloorId.trim();
    const name = newFloorName.trim();
    if (!id || !name) return;
    if (mapData.floors.some((f) => f.id === id)) {
      window.alert("该楼层 id 已存在");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const newFloor: Floor = { id, name, image: url, imageSize: { width: img.naturalWidth, height: img.naturalHeight } };
      patch((md) => ({ ...md, floors: [...md.floors, newFloor] }));
      setImagePathHints((h) => ({ ...h, [id]: `/maps/${mapData.id || "map"}/${id}.${file.name.split(".").pop() ?? "png"}` }));
      switchFloor(id);
      setShowAddFloor(false);
      setNewFloorId("");
      setNewFloorName("");
    };
    img.src = url;
  }

  function handleExport() {
    const exportData: MapData = structuredClone(mapData);
    exportData.floors = exportData.floors.map((f) =>
      f.image.startsWith("blob:") && imagePathHints[f.id] ? { ...f, image: imagePathHints[f.id] } : f
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapData.id || "map"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as MapData;
        if (!data.floors || !Array.isArray(data.floors) || data.floors.length === 0) {
          throw new Error("缺少 floors");
        }
        setMapData(data);
        setActiveFloorId(data.floors[0].id);
        setActiveOperatorId(Object.keys(data.operators ?? {})[0] ?? null);
        setActiveGadgetId(getOperatorInfo(Object.keys(data.operators ?? {})[0] ?? "")?.gadget?.id ?? null);
        setSelection(null);
        setDraft(null);
        setDragTarget(null);
        setHistory([]);
        setImagePathHints({});
      } catch (err) {
        window.alert(`导入失败,JSON 格式不对:${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  }

  function deleteSelection() {
    if (!selection) return;
    if (selection.kind === "wall") {
      commit({ ...mapData, walls: mapData.walls.filter((w) => w.id !== selection.id) });
    } else if (selection.kind === "opening") {
      commit({ ...mapData, openings: mapData.openings.filter((o) => o.id !== selection.id) });
    } else if (selection.kind === "textLabel") {
      commit({ ...mapData, textLabels: mapData.textLabels.filter((t) => t.id !== selection.id) });
    } else if (selection.kind === "commonPlacement") {
      commit({ ...mapData, commonPlacements: mapData.commonPlacements.filter((p) => p.id !== selection.id) });
    } else if (selection.kind === "placement") {
      const op = mapData.operators[selection.operatorId];
      commit({
        ...mapData,
        operators: {
          ...mapData.operators,
          [selection.operatorId]: { ...op, placements: op.placements.filter((p) => p.id !== selection.id) },
        },
      });
    }
    setSelection(null);
  }

  /** 清空当前楼层所有标记(墙/洞口/文字/道具位),其他楼层不受影响。会先弹确认,清完还能 Ctrl+Z 撤销。 */
  function clearFloor() {
    const floorLabel = floor.name;
    if (!window.confirm(`确定要清空「${floorLabel}」这一层的所有标记吗?(墙体/洞口/文字标注/道具位都会删掉,其他楼层不受影响)`)) {
      return;
    }
    commit({
      ...mapData,
      walls: mapData.walls.filter((w) => w.floor !== activeFloorId),
      openings: mapData.openings.filter((o) => o.floor !== activeFloorId),
      textLabels: mapData.textLabels.filter((t) => t.floor !== activeFloorId),
      commonPlacements: mapData.commonPlacements.filter((p) => p.floor !== activeFloorId),
      operators: Object.fromEntries(
        Object.entries(mapData.operators).map(([opId, op]) => [
          opId,
          { ...op, placements: op.placements.filter((p) => p.floor !== activeFloorId) },
        ])
      ),
    });
    setSelection(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "Escape") {
        setTool("select");
        setSelection(null);
        setDraft(null);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selection && !typing) {
        deleteSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, history, mapData]);

  function startDrag(target: DragTarget, e: React.PointerEvent) {
    // 不限制当前工具:不管正在用哪个工具,指针按在已有点状标记(洞口/文字/道具位)、
    // 墙体中点的"墙"字徽章、或墙体端点手柄上,都优先当作"选中+拖动"处理,
    // 不用先切回「选择」工具。端点手柄用来微调墙的起点/终点(改变长度/角度)。
    e.stopPropagation();
    // react-zoom-pan-pinch 监听的是 window 上的 mousedown(不是 pointerdown)来触发平移,
    // 两者是浏览器分别派发的独立事件,stopPropagation 拦不住后者。preventDefault 能按规范
    // 抑制 pointerdown 之后浏览器补发的兼容鼠标事件,从根上不让平移逻辑收到这次按下。
    e.preventDefault();
    snapshotHistory();
    setDragTarget(target);
    setSelection(
      target.kind === "wall-endpoint" || target.kind === "wall-move"
        ? { kind: "wall", id: target.id }
        : target.kind === "resize" || target.kind === "rotate"
        ? target.target
        : target.kind === "placement"
        ? { kind: "placement", operatorId: target.operatorId, id: target.id }
        : { kind: target.kind, id: target.id }
    );
  }

  function applyDragMove(point: ImagePoint) {
    const target = dragTarget;
    if (!target) return;
    setMapData((md) => {
      if (target.kind === "wall-endpoint") {
        return {
          ...md,
          walls: md.walls.map((w) =>
            w.id === target.id
              ? { ...w, points: target.which === 0 ? [point, w.points[1]] : [w.points[0], point] }
              : w
          ),
        };
      }
      if (target.kind === "wall-move") {
        return {
          ...md,
          walls: md.walls.map((w) =>
            w.id === target.id
              ? {
                  ...w,
                  points: [
                    { x: point.x - target.halfVector.x, y: point.y - target.halfVector.y },
                    { x: point.x + target.halfVector.x, y: point.y + target.halfVector.y },
                  ],
                }
              : w
          ),
        };
      }
      if (target.kind === "placement") {
        const op = md.operators[target.operatorId];
        return {
          ...md,
          operators: {
            ...md.operators,
            [target.operatorId]: {
              ...op,
              placements: op.placements.map((p) => (p.id === target.id ? { ...p, pos: point } : p)),
            },
          },
        };
      }
      if (target.kind === "textLabel") {
        return { ...md, textLabels: md.textLabels.map((t) => (t.id === target.id ? { ...t, pos: point } : t)) };
      }
      if (target.kind === "commonPlacement") {
        return { ...md, commonPlacements: md.commonPlacements.map((p) => (p.id === target.id ? { ...p, pos: point } : p)) };
      }
      if (target.kind === "resize") {
        const d = dist(target.center, point);
        const newSize = Math.min(3, Math.max(0.4, d / (RESIZE_HANDLE_BASE_DIST * iconScale)));
        const sel = target.target;
        if (sel.kind === "wall") {
          return { ...md, walls: md.walls.map((w) => (w.id === sel.id ? { ...w, size: newSize } : w)) };
        }
        if (sel.kind === "opening") {
          return { ...md, openings: md.openings.map((o) => (o.id === sel.id ? { ...o, size: newSize } : o)) };
        }
        if (sel.kind === "textLabel") {
          return { ...md, textLabels: md.textLabels.map((t) => (t.id === sel.id ? { ...t, size: newSize } : t)) };
        }
        if (sel.kind === "commonPlacement") {
          return { ...md, commonPlacements: md.commonPlacements.map((p) => (p.id === sel.id ? { ...p, size: newSize } : p)) };
        }
        const op = md.operators[sel.operatorId];
        return {
          ...md,
          operators: {
            ...md.operators,
            [sel.operatorId]: {
              ...op,
              placements: op.placements.map((p) => (p.id === sel.id ? { ...p, size: newSize } : p)),
            },
          },
        };
      }
      if (target.kind === "rotate") {
        const angle = angleDeg(target.center, point);
        const sel = target.target;
        if (sel.kind === "wall") {
          return { ...md, walls: md.walls.map((w) => (w.id === sel.id ? { ...w, rotation: angle } : w)) };
        }
        if (sel.kind === "opening") {
          return { ...md, openings: md.openings.map((o) => (o.id === sel.id ? { ...o, rotation: angle } : o)) };
        }
        if (sel.kind === "textLabel") {
          return { ...md, textLabels: md.textLabels.map((t) => (t.id === sel.id ? { ...t, rotation: angle } : t)) };
        }
        // 道具位(包括通用道具位)没有单独的 rotation 字段:直接复用已有的 facing(朝向),
        // 拖旋转把手 = 转朝向,视野扇形/头像会跟着一起转。
        if (sel.kind === "commonPlacement") {
          return { ...md, commonPlacements: md.commonPlacements.map((p) => (p.id === sel.id ? { ...p, facing: angle } : p)) };
        }
        const op = md.operators[sel.operatorId];
        return {
          ...md,
          operators: {
            ...md.operators,
            [sel.operatorId]: {
              ...op,
              placements: op.placements.map((p) => (p.id === sel.id ? { ...p, facing: angle } : p)),
            },
          },
        };
      }
      return { ...md, openings: md.openings.map((o) => (o.id === target.id ? { ...o, pos: point } : o)) };
    });
  }

  const HIT_RADIUS = 20;

  /** 在当前楼层找一个离 point 足够近的已有点状标记(洞口/文字/道具位/通用道具位),
   * 用来判断"这次点击是想加一个新标记,还是点在了已有标记上面"。 */
  function findExistingMarkerAt(point: ImagePoint): Selection | null {
    for (const o of mapData.openings) {
      if (o.floor === activeFloorId && dist(o.pos, point) <= HIT_RADIUS) return { kind: "opening", id: o.id };
    }
    for (const t of mapData.textLabels) {
      if (t.floor === activeFloorId && dist(t.pos, point) <= HIT_RADIUS) return { kind: "textLabel", id: t.id };
    }
    for (const p of mapData.commonPlacements) {
      if (p.floor === activeFloorId && dist(p.pos, point) <= HIT_RADIUS) return { kind: "commonPlacement", id: p.id };
    }
    for (const [opId, op] of Object.entries(mapData.operators)) {
      for (const p of op.placements) {
        if (p.floor === activeFloorId && dist(p.pos, point) <= HIT_RADIUS) {
          return { kind: "placement", operatorId: opId, id: p.id };
        }
      }
    }
    return null;
  }

  function handlePointerDownImage(point: ImagePoint) {
    if (tool === "select") return;
    if (tool === "wall") {
      setDraft({ kind: "wall", start: point, current: point });
    } else if (tool.startsWith("opening_")) {
      const existing = findExistingMarkerAt(point);
      if (existing) {
        setSelection(existing);
        return;
      }
      const purpose = TOOL_OPENING_PURPOSE[tool]!;
      const id = genId("o");
      commit({ ...mapData, openings: [...mapData.openings, { id, floor: activeFloorId, pos: point, purpose }] });
      setSelection({ kind: "opening", id });
    } else if (tool === "textLabel") {
      const existing = findExistingMarkerAt(point);
      if (existing) {
        setSelection(existing);
        return;
      }
      const id = genId("t");
      commit({ ...mapData, textLabels: [...mapData.textLabels, { id, floor: activeFloorId, pos: point, text: "房间名" }] });
      setSelection({ kind: "textLabel", id });
    } else if (tool === "placement") {
      // 不强制要求先选干员:选了干员就放到那个干员名下,没选干员但选了通用道具
      // 就当成不挂靠任何干员的通用道具位(跟洞口一样独立存在)。
      if (!activeGadgetId) {
        window.alert("请先选择要放置的道具。");
        return;
      }
      const existing = findExistingMarkerAt(point);
      if (existing) {
        setSelection(existing);
        return;
      }
      setDraft({ kind: "placement", start: point, current: point });
    }
  }

  function handlePointerMoveImage(point: ImagePoint) {
    setDraft((d) => (d ? { ...d, current: point } : d));
    if (dragTarget) applyDragMove(point);
  }

  function handlePointerUpImage(point: ImagePoint) {
    if (draft?.kind === "wall") {
      if (dist(draft.start, point) >= 5) {
        const id = genId("w");
        const newWall: Wall = { id, floor: activeFloorId, points: [draft.start, point] };
        commit({ ...mapData, walls: [...mapData.walls, newWall] });
        setSelection({ kind: "wall", id });
      }
      setDraft(null);
    }
    if (draft?.kind === "placement" && activeGadgetId) {
      const facing = dist(draft.start, point) >= 8 ? angleDeg(draft.start, point) : undefined;
      const id = genId("p");
      const gadgetName = findGadgetName(activeGadgetId, activeOperatorId ?? undefined) ?? "未命名道具位";
      const newPlacement: Placement = {
        id,
        floor: activeFloorId,
        pos: draft.start,
        title: gadgetName,
        description: "",
        tier: "core",
        facing,
        gadgetId: activeGadgetId,
      };
      if (activeOperatorId) {
        const op = mapData.operators[activeOperatorId];
        commit({
          ...mapData,
          operators: { ...mapData.operators, [activeOperatorId]: { ...op, placements: [...op.placements, newPlacement] } },
        });
      } else {
        // 没选干员 = 通用道具位,不挂在任何干员名下,独立存进 commonPlacements。
        commit({ ...mapData, commonPlacements: [...mapData.commonPlacements, newPlacement] });
      }
      // 特意不 setSelection:放完接着放下一个,不用每次都被下面弹出来的编辑面板打断。
      // 想改标题/说明/截图这些细节,切到「选择」工具点它一下就行。
      setDraft(null);
    }
    if (dragTarget) setDragTarget(null);
  }

  /** 从干员头像网格选择:如果这个干员在当前地图里还没出现过,就用名单里的名字/头像自动注册一个 */
  function selectOperator(id: string | null) {
    setActiveOperatorId(id);
    if (id && !mapData.operators[id]) {
      const info = getOperatorInfo(id);
      if (info) {
        patch((md) => ({
          ...md,
          operators: { ...md.operators, [id]: { name: info.name, icon: info.icon, placements: [] } },
        }));
      }
    }
    setActiveGadgetId(id ? getOperatorInfo(id)?.gadget?.id ?? null : null);
    // 选干员本身就代表"我要开始摆道具位了",不需要再额外点一次左侧的工具按钮
    if (id) setTool("placement");
  }

  function addOperator() {
    const id = newOperatorId.trim();
    const name = newOperatorName.trim();
    if (!id || !name) return;
    if (mapData.operators[id]) {
      window.alert("该干员 id 已存在");
      return;
    }
    patch((md) => ({ ...md, operators: { ...md.operators, [id]: { name, placements: [] } } }));
    setActiveOperatorId(id);
    setActiveGadgetId(null);
    setNewOperatorId("");
    setNewOperatorName("");
  }

  const selectedWall = selection?.kind === "wall" ? mapData.walls.find((w) => w.id === selection.id) : undefined;
  const wallsOnFloor = mapData.walls.filter((w) => w.floor === activeFloorId);
  const openingsOnFloor = mapData.openings.filter((o) => o.floor === activeFloorId);
  const textLabelsOnFloor = mapData.textLabels.filter((t) => t.floor === activeFloorId);
  const commonPlacementsOnFloor = mapData.commonPlacements.filter((p) => p.floor === activeFloorId);

  /** 当前选中标记的中心点 + 当前 size/rotation,用来摆放拉大缩小/旋转把手。
   * 道具位没有单独的 rotation 字段,直接读 facing(没设置过就当 0)。 */
  function getSelectedResizeInfo(): { center: ImagePoint; size: number; rotation: number } | null {
    if (!selection) return null;
    if (selection.kind === "wall") {
      if (!selectedWall) return null;
      const [p1, p2] = selectedWall.points;
      return {
        center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        size: selectedWall.size ?? 1,
        rotation: selectedWall.rotation ?? 0,
      };
    }
    if (selection.kind === "opening") {
      const o = openingsOnFloor.find((o) => o.id === selection.id);
      return o ? { center: o.pos, size: o.size ?? 1, rotation: o.rotation ?? 0 } : null;
    }
    if (selection.kind === "textLabel") {
      const t = textLabelsOnFloor.find((t) => t.id === selection.id);
      return t ? { center: t.pos, size: t.size ?? 1, rotation: t.rotation ?? 0 } : null;
    }
    if (selection.kind === "commonPlacement") {
      const p = commonPlacementsOnFloor.find((p) => p.id === selection.id);
      return p ? { center: p.pos, size: p.size ?? 1, rotation: p.facing ?? 0 } : null;
    }
    const p = mapData.operators[selection.operatorId]?.placements.find((p) => p.id === selection.id);
    return p ? { center: p.pos, size: p.size ?? 1, rotation: p.facing ?? 0 } : null;
  }
  const resizeInfo = getSelectedResizeInfo();

  return (
    <div className="flex h-dvh flex-col bg-neutral-100 dark:bg-neutral-950">
      <header className="z-30 flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">地图标注编辑器</h1>

        <select
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          value={REGISTRY_MAP_IDS.includes(mapData.id) ? mapData.id : ""}
          onChange={(e) => e.target.value && loadRegistryMap(e.target.value)}
        >
          <option value="">从已注册地图加载…</option>
          {REGISTRY_MAP_IDS.map((id) => (
            <option key={id} value={id}>
              {ALL_MAPS[id].name}
            </option>
          ))}
        </select>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          上传本地底图…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadCustomImage(file);
            e.target.value = "";
          }}
        />

        <div className="flex gap-1">
          {mapData.floors.map((f) => (
            <button
              key={f.id}
              onClick={() => switchFloor(f.id)}
              className={[
                "rounded px-2 py-1 text-xs font-medium",
                f.id === activeFloorId
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
              ].join(" ")}
            >
              {f.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddFloor((v) => !v)}
            className="rounded border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            + 添加楼层
          </button>
          {showAddFloor && (
            <div className="flex items-center gap-1">
              <input
                value={newFloorId}
                onChange={(e) => setNewFloorId(e.target.value)}
                placeholder="楼层 id,如 2f/b1"
                className="w-24 rounded border border-neutral-300 px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
              <input
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="显示名,如 2F/地下"
                className="w-24 rounded border border-neutral-300 px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                onClick={() => {
                  if (!newFloorId.trim() || !newFloorName.trim()) {
                    window.alert("请先填楼层 id 和名称");
                    return;
                  }
                  addFloorInputRef.current?.click();
                }}
                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                选择图片…
              </button>
              <input
                ref={addFloorInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addFloor(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-neutral-300 px-1 dark:border-neutral-700">
            <span className="pl-1 text-xs text-neutral-500">图标</span>
            <button
              onClick={() => setIconScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10))}
              className="px-1.5 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="缩小图标"
            >
              −
            </button>
            <span className="w-9 text-center text-xs tabular-nums text-neutral-600 dark:text-neutral-300">
              {Math.round(iconScale * 100)}%
            </span>
            <button
              onClick={() => setIconScale((s) => Math.min(2.5, Math.round((s + 0.1) * 10) / 10))}
              className="px-1.5 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="放大图标"
            >
              ＋
            </button>
          </div>
          <button
            onClick={clearFloor}
            className="rounded border border-amber-300 px-2 py-1 text-sm text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
          >
            清空本层
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
          >
            撤销 ({history.length})
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="rounded border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            导入 JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={handleExport}
            className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500"
          >
            导出 JSON
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-44 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTool(t.id);
                setDraft(null);
              }}
              className={[
                "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                tool === t.id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              {t.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />}
              {t.label}
            </button>
          ))}


          <p className="mt-4 text-xs leading-relaxed text-neutral-400">
            封墙:拖拽一下 = 一段墙。画完后选中它,拖两端的白色圆点手柄可以微调长度/角度,墙中点上的「墙」字徽章可以拖动整段墙平移,面板数(墙×N)在右侧面板里填。
            <br />
            洞口:直接选翻越/过人/对枪/脚洞/跳层里的一个,点一下放置,类型放错了选中后还能改。
            <br />
            文字标注:点一下放置,右侧改文字,给房间起名。
            <br />
            道具位:先在右侧选干员再选道具,点一下放置,拖动可定朝向。
            <br />
            选中任意标记后,图标旁会出现两个把手:白色的拉大缩小,蓝色虚线连着的是旋转,拖着转一圈就行。
            <br />
            任意工具下,指针按在已有标记上都是直接选中并可拖动,不会重复叠加;点在空白处才会新建。
            <br />
            快捷键:Esc 取消 · Delete 删除 · Ctrl+Z 撤销
          </p>
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1">
          <MapStage
            floor={floor}
            panningDisabled={tool !== "select" || dragTarget !== null}
            onPointerDownImage={handlePointerDownImage}
            onPointerMoveImage={handlePointerMoveImage}
            onPointerUpImage={handlePointerUpImage}
          >
            {textLabelsOnFloor.map((label) => (
              <TextLabelMarker
                key={label.id}
                label={label}
                scale={iconScale}
                selected={selection?.kind === "textLabel" && selection.id === label.id}
                onClick={() => setSelection({ kind: "textLabel", id: label.id })}
                onPointerDown={(e) => startDrag({ kind: "textLabel", id: label.id }, e)}
              />
            ))}

            {wallsOnFloor.map((wall) => (
              <WallLine
                key={wall.id}
                wall={wall}
                scale={iconScale}
                selected={selection?.kind === "wall" && selection.id === wall.id}
                onClick={() => setSelection({ kind: "wall", id: wall.id })}
                onMovePointerDown={(e) => {
                  const [p1, p2] = wall.points;
                  const halfVector = { x: (p2.x - p1.x) / 2, y: (p2.y - p1.y) / 2 };
                  startDrag({ kind: "wall-move", id: wall.id, halfVector }, e);
                }}
              />
            ))}

            {openingsOnFloor.map((o) => (
              <OpeningMarker
                key={o.id}
                opening={o}
                scale={iconScale}
                selected={selection?.kind === "opening" && selection.id === o.id}
                onClick={() => setSelection({ kind: "opening", id: o.id })}
                onPointerDown={(e) => startDrag({ kind: "opening", id: o.id }, e)}
              />
            ))}

            {commonPlacementsOnFloor.map((p) => (
              <PlacementMarker
                key={p.id}
                placement={p}
                color={COMMON_GADGET_COLOR}
                scale={iconScale}
                selected={selection?.kind === "commonPlacement" && selection.id === p.id}
                onClick={() => setSelection({ kind: "commonPlacement", id: p.id })}
                onPointerDown={(e) => startDrag({ kind: "commonPlacement", id: p.id }, e)}
              />
            ))}

            {Object.entries(mapData.operators).flatMap(([opId, op]) =>
              op.placements
                .filter((p) => p.floor === activeFloorId)
                .map((p) => (
                  <PlacementMarker
                    key={p.id}
                    placement={p}
                    color={getOperatorColor(opId)}
                    icon={op.icon}
                    scale={iconScale}
                    selected={selection?.kind === "placement" && selection.id === p.id}
                    onClick={() => setSelection({ kind: "placement", operatorId: opId, id: p.id })}
                    onPointerDown={(e) => startDrag({ kind: "placement", operatorId: opId, id: p.id }, e)}
                  />
                ))
            )}

            {selectedWall && (
              <>
                <circle
                  cx={selectedWall.points[0].x}
                  cy={selectedWall.points[0].y}
                  r={9 * iconScale}
                  fill="#fff"
                  stroke="#111"
                  strokeWidth={2}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => startDrag({ kind: "wall-endpoint", id: selectedWall.id, which: 0 }, e)}
                />
                <circle
                  cx={selectedWall.points[1].x}
                  cy={selectedWall.points[1].y}
                  r={9 * iconScale}
                  fill="#fff"
                  stroke="#111"
                  strokeWidth={2}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => startDrag({ kind: "wall-endpoint", id: selectedWall.id, which: 1 }, e)}
                />
              </>
            )}

            {selection && resizeInfo && (() => {
              const handleDist = RESIZE_HANDLE_BASE_DIST * resizeInfo.size * iconScale;
              const hx = resizeInfo.center.x + handleDist * 0.7071;
              const hy = resizeInfo.center.y + handleDist * 0.7071;
              return (
                <circle
                  cx={hx}
                  cy={hy}
                  r={7 * iconScale}
                  fill="#fff"
                  stroke="#111"
                  strokeWidth={2}
                  style={{ cursor: "nwse-resize" }}
                  onPointerDown={(e) => startDrag({ kind: "resize", target: selection, center: resizeInfo.center }, e)}
                />
              );
            })()}

            {selection && resizeInfo && (() => {
              const rad = (resizeInfo.rotation * Math.PI) / 180;
              const handleDist = ROTATE_HANDLE_DIST * iconScale;
              const rx = resizeInfo.center.x + handleDist * Math.cos(rad);
              const ry = resizeInfo.center.y + handleDist * Math.sin(rad);
              return (
                <>
                  <line
                    x1={resizeInfo.center.x}
                    y1={resizeInfo.center.y}
                    x2={rx}
                    y2={ry}
                    stroke="#60a5fa"
                    strokeWidth={2}
                    strokeDasharray="2 3"
                  />
                  <circle
                    cx={rx}
                    cy={ry}
                    r={7 * iconScale}
                    fill="#60a5fa"
                    stroke="#111"
                    strokeWidth={2}
                    style={{ cursor: "grab" }}
                    onPointerDown={(e) => startDrag({ kind: "rotate", target: selection, center: resizeInfo.center }, e)}
                  />
                </>
              );
            })()}

            {draft?.kind === "wall" && (
              <line
                x1={draft.start.x}
                y1={draft.start.y}
                x2={draft.current.x}
                y2={draft.current.y}
                stroke={WALL_COLOR}
                strokeWidth={6}
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
            )}
            {draft?.kind === "placement" && (
              <>
                <line
                  x1={draft.start.x}
                  y1={draft.start.y}
                  x2={draft.current.x}
                  y2={draft.current.y}
                  stroke="#16a34a"
                  strokeWidth={4}
                  strokeDasharray="4 4"
                />
                <circle cx={draft.start.x} cy={draft.start.y} r={16} fill="#16a34a" stroke="#fff" strokeWidth={3} opacity={0.7} />
              </>
            )}
          </MapStage>
        </main>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className={selection ? "mb-4 space-y-2 border-b border-neutral-200 pb-4 text-sm dark:border-neutral-800" : "space-y-2 text-sm"}>
            <div className="flex rounded border border-neutral-300 text-xs dark:border-neutral-700">
              <button
                onClick={() => setOperatorRoleTab("defend")}
                className={[
                  "flex-1 rounded-l px-2 py-1.5 font-medium",
                  operatorRoleTab === "defend"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                ].join(" ")}
              >
                防守
              </button>
              <button
                onClick={() => setOperatorRoleTab("attack")}
                className={[
                  "flex-1 rounded-r px-2 py-1.5 font-medium",
                  operatorRoleTab === "attack"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                ].join(" ")}
              >
                进攻
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {getOperatorsByRole(operatorRoleTab).map((d) => (
                <button
                  key={d.id}
                  title={d.name}
                  onClick={() => selectOperator(activeOperatorId === d.id ? null : d.id)}
                  className={[
                    "flex flex-col items-center gap-1 rounded p-1 text-[11px] leading-tight",
                    activeOperatorId === d.id
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  ].join(" ")}
                >
                  <OperatorAvatar icon={d.icon} name={d.name} color={getOperatorColor(d.id)} size={36} />
                  <span className="w-full truncate text-center">{d.name}</span>
                </button>
              ))}
            </div>
            {Object.keys(mapData.operators).filter((id) => !getOperatorInfo(id)).length > 0 && (
              <>
                <p className="text-xs text-neutral-500">自定义干员</p>
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(mapData.operators)
                    .filter((id) => !getOperatorInfo(id))
                    .map((id) => (
                      <button
                        key={id}
                        title={`${mapData.operators[id].name}(自定义)`}
                        onClick={() => selectOperator(activeOperatorId === id ? null : id)}
                        className={[
                          "flex flex-col items-center gap-1 rounded p-1 text-[11px] leading-tight",
                          activeOperatorId === id
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                        ].join(" ")}
                      >
                        <OperatorAvatar icon={mapData.operators[id].icon} name={mapData.operators[id].name} color={getOperatorColor(id)} size={36} />
                        <span className="w-full truncate text-center">{mapData.operators[id].name}</span>
                      </button>
                    ))}
                </div>
              </>
            )}

            {activeOperatorId &&
              (() => {
                const opInfo = getOperatorInfo(activeOperatorId);
                if (!opInfo?.gadget) return null;
                return (
                  <>
                    <p className="text-xs text-neutral-500">专属道具(选干员时已自动选中)</p>
                    <button
                      onClick={() => setActiveGadgetId(opInfo.gadget!.id)}
                      className={[
                        "w-full rounded border px-2 py-1.5 text-left text-sm font-medium",
                        activeGadgetId === opInfo.gadget.id
                          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                          : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
                      ].join(" ")}
                    >
                      {opInfo.gadget.name}
                    </button>
                  </>
                );
              })()}

            {/* 通用道具不挂在任何干员名下,跟洞口一样是独立标记:点了直接能在地图上放,
                不需要先选干员。点这里会顺便清掉当前选中的干员,避免误挂到某个干员名下。 */}
            <p className="text-xs text-neutral-500">通用道具(不挂靠干员,选了直接能放)</p>
            <div className="flex flex-wrap gap-1.5">
              {(operatorRoleTab === "attack" ? COMMON_GADGETS_ATTACK : COMMON_GADGETS_DEFEND).map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveOperatorId(null);
                    setActiveGadgetId(g.id);
                    setTool("placement");
                  }}
                  className={[
                    "flex items-center gap-1.5 rounded border px-2 py-1 text-xs",
                    activeGadgetId === g.id && !activeOperatorId
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  ].join(" ")}
                >
                  {/* 通用道具还没有专门图标,先用个圆点占位,以后有图了直接换成 <img> */}
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                  {g.name}
                </button>
              ))}
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-neutral-500">名单没有的干员?手动加一个</summary>
                <div className="mt-1 space-y-1">
                  <input
                    value={newOperatorId}
                    onChange={(e) => setNewOperatorId(e.target.value)}
                    placeholder="干员 id,如 sledge"
                    className="w-full rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <input
                    value={newOperatorName}
                    onChange={(e) => setNewOperatorName(e.target.value)}
                    placeholder="显示名,如 Sledge"
                    className="w-full rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <button
                    onClick={addOperator}
                    className="w-full rounded border border-neutral-300 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    + 添加
                  </button>
                </div>
              </details>
          </div>

          {!selection && (
            <p className="text-sm text-neutral-400">
              上方选干员可直接在地图上放置道具位;左侧还有封墙/洞口/文字标注等工具,或切到「选择」模式点击已有标记查看/编辑。
            </p>
          )}
          {selection?.kind === "wall" && selectedWall && (
            <WallPanel wall={selectedWall} onPatch={(p) => patch((md) => ({ ...md, walls: md.walls.map((w) => (w.id === selectedWall.id ? { ...w, ...p } : w)) }))} onDelete={deleteSelection} />
          )}
          {selection?.kind === "opening" && (
            <OpeningPanel
              opening={openingsOnFloor.find((o) => o.id === selection.id)}
              onPatch={(p) => patch((md) => ({ ...md, openings: md.openings.map((o) => (o.id === selection.id ? { ...o, ...p } : o)) }))}
              onDelete={deleteSelection}
            />
          )}
          {selection?.kind === "textLabel" && (
            <TextLabelPanel
              label={textLabelsOnFloor.find((t) => t.id === selection.id)}
              onPatch={(p) => patch((md) => ({ ...md, textLabels: md.textLabels.map((t) => (t.id === selection.id ? { ...t, ...p } : t)) }))}
              onDelete={deleteSelection}
            />
          )}
          {selection?.kind === "commonPlacement" && (
            <CommonPlacementPanel
              placement={commonPlacementsOnFloor.find((p) => p.id === selection.id)}
              wallOptions={wallsOnFloor}
              onPatch={(p) => patch((md) => ({ ...md, commonPlacements: md.commonPlacements.map((pl) => (pl.id === selection.id ? { ...pl, ...p } : pl)) }))}
              onDelete={deleteSelection}
            />
          )}
          {selection?.kind === "placement" && (
            <PlacementPanel
              placement={mapData.operators[selection.operatorId]?.placements.find((p) => p.id === selection.id)}
              operatorId={selection.operatorId}
              operatorName={mapData.operators[selection.operatorId]?.name ?? selection.operatorId}
              wallOptions={wallsOnFloor}
              onPatch={(p) =>
                patch((md) => {
                  const op = md.operators[selection.operatorId];
                  return {
                    ...md,
                    operators: {
                      ...md.operators,
                      [selection.operatorId]: {
                        ...op,
                        placements: op.placements.map((pl) => (pl.id === selection.id ? { ...pl, ...p } : pl)),
                      },
                    },
                  };
                })
              }
              onDelete={deleteSelection}
            />
          )}

          {Object.keys(imagePathHints).length > 0 && (
            <div className="mt-6 space-y-3 border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800">
              <p className="text-neutral-500">
                导出用底图路径(本地上传的图只是预览,需把图片文件放到 public 对应位置才能在正式页面显示)
              </p>
              {mapData.floors
                .filter((f) => f.id in imagePathHints)
                .map((f) => (
                  <label key={f.id} className="block">
                    <span className="text-neutral-500">{f.name}</span>
                    <input
                      value={imagePathHints[f.id]}
                      onChange={(e) => setImagePathHints((h) => ({ ...h, [f.id]: e.target.value }))}
                      className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </label>
                ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function WallPanel({
  wall,
  onPatch,
  onDelete,
}: {
  wall: Wall;
  onPatch: (patch: Partial<Wall>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">封墙</h2>
      <label className="block text-xs text-neutral-500">
        面板数(徽章显示「墙×N」,留空/1 就只显示「墙」)
        <input
          type="number"
          min={1}
          value={wall.count ?? ""}
          onChange={(e) => onPatch({ count: e.target.value === "" ? undefined : Math.max(1, Number(e.target.value)) })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        说明
        <textarea
          value={wall.note ?? ""}
          onChange={(e) => onPatch({ note: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
        删除该墙体
      </button>
    </div>
  );
}

function OpeningPanel({
  opening,
  onPatch,
  onDelete,
}: {
  opening?: Opening;
  onPatch: (patch: Partial<Opening>) => void;
  onDelete: () => void;
}) {
  if (!opening) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">
        洞口 · <span style={{ color: OPENING_PURPOSE_COLOR[opening.purpose] }}>{OPENING_PURPOSE_LABEL[opening.purpose]}</span>
      </h2>
      <label className="block text-xs text-neutral-500">
        类型
        <select
          value={opening.purpose}
          onChange={(e) => onPatch({ purpose: e.target.value as OpeningPurpose })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {OPENING_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {OPENING_PURPOSE_LABEL[p]}
            </option>
          ))}
        </select>
      </label>
      {opening.purpose === "floor" && (
        <label className="block text-xs text-neutral-500">
          通向(楼层 id)
          <input
            value={opening.connectsTo ?? ""}
            onChange={(e) => onPatch({ connectsTo: e.target.value })}
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>
      )}
      <label className="block text-xs text-neutral-500">
        说明
        <textarea
          value={opening.note ?? ""}
          onChange={(e) => onPatch({ note: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
        删除
      </button>
    </div>
  );
}

function TextLabelPanel({
  label,
  onPatch,
  onDelete,
}: {
  label?: TextLabel;
  onPatch: (patch: Partial<TextLabel>) => void;
  onDelete: () => void;
}) {
  if (!label) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">文字标注</h2>
      <label className="block text-xs text-neutral-500">
        文字(房间名)
        <input
          value={label.text}
          onChange={(e) => onPatch({ text: e.target.value })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
        删除
      </button>
    </div>
  );
}

function PlacementPanel({
  placement,
  operatorId,
  operatorName,
  wallOptions,
  onPatch,
  onDelete,
}: {
  placement?: Placement;
  operatorId: string;
  operatorName: string;
  wallOptions: Wall[];
  onPatch: (patch: Partial<Placement>) => void;
  onDelete: () => void;
}) {
  if (!placement) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">道具位 · {operatorName}</h2>
      <label className="block text-xs text-neutral-500">
        道具
        <select
          value={placement.gadgetId ?? ""}
          onChange={(e) => onPatch({ gadgetId: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">(未设置)</option>
          {getGadgetOptions(operatorId).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-neutral-500">
        标题
        <input
          value={placement.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        说明
        <textarea
          value={placement.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        等级
        <select
          value={placement.tier}
          onChange={(e) => onPatch({ tier: e.target.value as PlacementTier })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="core">核心位</option>
          <option value="alternative">备用位</option>
        </select>
      </label>
      <label className="block text-xs text-neutral-500">
        朝向角度(0=右,顺时针,留空=无朝向)
        <input
          type="number"
          value={placement.facing ?? ""}
          onChange={(e) => onPatch({ facing: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        依赖墙体
        <select
          value={placement.requiresWall ?? ""}
          onChange={(e) => onPatch({ requiresWall: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">无</option>
          {wallOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-neutral-500">
        截图路径
        <input
          value={placement.screenshot ?? ""}
          onChange={(e) => onPatch({ screenshot: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
        删除该道具位
      </button>
    </div>
  );
}

/** 通用道具位:不挂在任何干员名下,道具下拉给的是全部通用道具(进攻+防守两边的都在),
 * 不像 PlacementPanel 那样局限在某一个干员的专属+同阵营通用道具里。 */
function CommonPlacementPanel({
  placement,
  wallOptions,
  onPatch,
  onDelete,
}: {
  placement?: Placement;
  wallOptions: Wall[];
  onPatch: (patch: Partial<Placement>) => void;
  onDelete: () => void;
}) {
  if (!placement) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">通用道具位</h2>
      <label className="block text-xs text-neutral-500">
        道具
        <select
          value={placement.gadgetId ?? ""}
          onChange={(e) => onPatch({ gadgetId: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">(未设置)</option>
          {[...COMMON_GADGETS_DEFEND, ...COMMON_GADGETS_ATTACK].map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-neutral-500">
        标题
        <input
          value={placement.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        说明
        <textarea
          value={placement.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        等级
        <select
          value={placement.tier}
          onChange={(e) => onPatch({ tier: e.target.value as PlacementTier })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="core">核心位</option>
          <option value="alternative">备用位</option>
        </select>
      </label>
      <label className="block text-xs text-neutral-500">
        朝向角度(0=右,顺时针,留空=无朝向)
        <input
          type="number"
          value={placement.facing ?? ""}
          onChange={(e) => onPatch({ facing: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        依赖墙体
        <select
          value={placement.requiresWall ?? ""}
          onChange={(e) => onPatch({ requiresWall: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">无</option>
          {wallOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-neutral-500">
        截图路径
        <input
          value={placement.screenshot ?? ""}
          onChange={(e) => onPatch({ screenshot: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
        删除该道具位
      </button>
    </div>
  );
}
