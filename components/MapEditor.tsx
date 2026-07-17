"use client";

import { useEffect, useRef, useState } from "react";
import MapStage, { type ImagePoint } from "@/components/MapStage";
import {
  WALL_COLOR,
  WallLine,
  PointMarker,
  PlacementMarker,
  TextLabelMarker,
  OPERATOR_COLOR,
  DEFAULT_OPERATOR_COLOR,
} from "@/components/mapMarkers";
import { MAPS } from "@/lib/maps";
import { DEFENDERS, findGadgetName, getDefender, getGadgetOptions } from "@/lib/operators";
import { WALL_STATE_LABEL } from "@/lib/schema";
import type { Floor, MapData, Placement, PlacementTier, TextLabel, Wall, WallState } from "@/lib/schema";

type Tool =
  | "select"
  | "wall_must_reinforce"
  | "wall_never_reinforce"
  | "wall_situational"
  | "hatch"
  | "rotate"
  | "textLabel"
  | "placement";

const TOOL_WALL_STATE: Partial<Record<Tool, WallState>> = {
  wall_must_reinforce: "must_reinforce",
  wall_never_reinforce: "never_reinforce",
  wall_situational: "situational",
};

const TOOLS: { id: Tool; label: string; color?: string }[] = [
  { id: "select", label: "选择 / 拖动" },
  { id: "wall_must_reinforce", label: "必封墙", color: WALL_COLOR.must_reinforce },
  { id: "wall_never_reinforce", label: "禁封墙", color: WALL_COLOR.never_reinforce },
  { id: "wall_situational", label: "情况墙", color: WALL_COLOR.situational },
  { id: "hatch", label: "天窗", color: "#9333ea" },
  { id: "rotate", label: "转点洞", color: "#ea580c" },
  { id: "textLabel", label: "文字标注", color: "#64748b" },
  { id: "placement", label: "道具位", color: "#16a34a" },
];

type Selection =
  | { kind: "wall"; id: string }
  | { kind: "hatch"; id: string }
  | { kind: "rotate"; id: string }
  | { kind: "textLabel"; id: string }
  | { kind: "placement"; operatorId: string; id: string };

type Draft =
  // R6 里一段可加固的墙实际是两片独立面板:起点→中点→终点,点三下生成两段 Wall。
  // p2 为空表示还在等第二次点击(中点);p2 有值表示在等第三次点击(终点)。
  | { kind: "wall3"; state: WallState; p1: ImagePoint; p2: ImagePoint | null; cursor: ImagePoint }
  | { kind: "placement"; start: ImagePoint; current: ImagePoint };

type DragTarget =
  | { kind: "wall-endpoint"; id: string; which: 0 | 1 }
  | { kind: "hatch" | "rotate" | "textLabel"; id: string }
  | { kind: "placement"; operatorId: string; id: string };

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
    hatches: [],
    rotates: [],
    textLabels: [],
    operators: {},
    presets: [],
  };
}

const REGISTRY_MAP_IDS = Object.keys(MAPS);

export default function MapEditor() {
  const [mapData, setMapData] = useState<MapData>(() => structuredClone(MAPS["border"]));
  const [activeFloorId, setActiveFloorId] = useState(mapData.floors[0].id);
  const [tool, setTool] = useState<Tool>("select");
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(
    Object.keys(mapData.operators)[0] ?? null
  );
  const [activeGadgetId, setActiveGadgetId] = useState<string | null>(
    getDefender(Object.keys(mapData.operators)[0] ?? "")?.gadget.id ?? null
  );
  const [selection, setSelection] = useState<Selection | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [history, setHistory] = useState<MapData[]>([]);
  const [newOperatorId, setNewOperatorId] = useState("");
  const [newOperatorName, setNewOperatorName] = useState("");
  const [imagePathHints, setImagePathHints] = useState<Record<string, string>>({});
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
    const data = MAPS[id];
    if (!data) return;
    setMapData(structuredClone(data));
    setActiveFloorId(data.floors[0].id);
    setActiveOperatorId(Object.keys(data.operators)[0] ?? null);
    setActiveGadgetId(getDefender(Object.keys(data.operators)[0] ?? "")?.gadget.id ?? null);
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
        setActiveGadgetId(getDefender(Object.keys(data.operators ?? {})[0] ?? "")?.gadget.id ?? null);
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
    } else if (selection.kind === "hatch") {
      commit({ ...mapData, hatches: mapData.hatches.filter((h) => h.id !== selection.id) });
    } else if (selection.kind === "rotate") {
      commit({ ...mapData, rotates: mapData.rotates.filter((r) => r.id !== selection.id) });
    } else if (selection.kind === "textLabel") {
      commit({ ...mapData, textLabels: mapData.textLabels.filter((t) => t.id !== selection.id) });
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
    if (tool !== "select") return;
    e.stopPropagation();
    snapshotHistory();
    setDragTarget(target);
    setSelection(
      target.kind === "wall-endpoint"
        ? { kind: "wall", id: target.id }
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
      if (target.kind === "hatch") {
        return { ...md, hatches: md.hatches.map((h) => (h.id === target.id ? { ...h, pos: point } : h)) };
      }
      if (target.kind === "textLabel") {
        return { ...md, textLabels: md.textLabels.map((t) => (t.id === target.id ? { ...t, pos: point } : t)) };
      }
      return { ...md, rotates: md.rotates.map((r) => (r.id === target.id ? { ...r, pos: point } : r)) };
    });
  }

  function handlePointerDownImage(point: ImagePoint) {
    if (tool === "select") return;
    if (tool.startsWith("wall_")) {
      const state = TOOL_WALL_STATE[tool]!;
      if (!draft || draft.kind !== "wall3") {
        // 第 1 次点击:起点
        setDraft({ kind: "wall3", state, p1: point, p2: null, cursor: point });
      } else if (draft.p2 === null) {
        // 第 2 次点击:中点(两片面板的公共分界点),太近就当误触忽略
        if (dist(draft.p1, point) >= 5) {
          setDraft({ ...draft, p2: point, cursor: point });
        }
      } else {
        // 第 3 次点击:终点,一次性生成两段墙
        const walls: Wall[] = [];
        if (dist(draft.p1, draft.p2) >= 5) {
          walls.push({ id: genId("w"), floor: activeFloorId, state: draft.state, points: [draft.p1, draft.p2] });
        }
        // 第三个点点在中点附近 = 只要一段墙(单片面板)
        if (dist(draft.p2, point) >= 5) {
          walls.push({ id: genId("w"), floor: activeFloorId, state: draft.state, points: [draft.p2, point] });
        }
        if (walls.length > 0) {
          commit({ ...mapData, walls: [...mapData.walls, ...walls] });
          setSelection({ kind: "wall", id: walls[walls.length - 1].id });
        }
        setDraft(null);
      }
    } else if (tool === "hatch") {
      const id = genId("h");
      commit({ ...mapData, hatches: [...mapData.hatches, { id, floor: activeFloorId, pos: point }] });
      setSelection({ kind: "hatch", id });
    } else if (tool === "rotate") {
      const id = genId("r");
      commit({ ...mapData, rotates: [...mapData.rotates, { id, floor: activeFloorId, pos: point }] });
      setSelection({ kind: "rotate", id });
    } else if (tool === "textLabel") {
      const id = genId("t");
      commit({ ...mapData, textLabels: [...mapData.textLabels, { id, floor: activeFloorId, pos: point, text: "房间名" }] });
      setSelection({ kind: "textLabel", id });
    } else if (tool === "placement") {
      if (!activeOperatorId) {
        window.alert("请先在下方选择一个干员,再放置道具位。");
        return;
      }
      if (!activeGadgetId) {
        window.alert("请先选择要放置的道具(专属道具 / 摄像头 / 部署盾)。");
        return;
      }
      setDraft({ kind: "placement", start: point, current: point });
    }
  }

  function handlePointerMoveImage(point: ImagePoint) {
    setDraft((d) => {
      if (!d) return d;
      if (d.kind === "wall3") return { ...d, cursor: point };
      return { ...d, current: point };
    });
    if (dragTarget) applyDragMove(point);
  }

  function handlePointerUpImage(point: ImagePoint) {
    if (draft?.kind === "placement" && activeOperatorId && activeGadgetId) {
      const facing = dist(draft.start, point) >= 8 ? angleDeg(draft.start, point) : undefined;
      const id = genId("p");
      const gadgetName = findGadgetName(activeGadgetId, activeOperatorId) ?? "未命名道具位";
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
      const op = mapData.operators[activeOperatorId];
      commit({
        ...mapData,
        operators: { ...mapData.operators, [activeOperatorId]: { ...op, placements: [...op.placements, newPlacement] } },
      });
      setSelection({ kind: "placement", operatorId: activeOperatorId, id });
      setDraft(null);
    }
    if (dragTarget) setDragTarget(null);
  }

  /** 从干员名单下拉选择:如果这个干员在当前地图里还没出现过,就用名单里的名字/头像自动注册一个 */
  function selectOperator(id: string | null) {
    setActiveOperatorId(id);
    if (id && !mapData.operators[id]) {
      const defender = getDefender(id);
      if (defender) {
        patch((md) => ({
          ...md,
          operators: { ...md.operators, [id]: { name: defender.name, icon: defender.icon, placements: [] } },
        }));
      }
    }
    setActiveGadgetId(id ? getDefender(id)?.gadget.id ?? null : null);
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
  const hatchesOnFloor = mapData.hatches.filter((h) => h.floor === activeFloorId);
  const rotatesOnFloor = mapData.rotates.filter((r) => r.floor === activeFloorId);
  const textLabelsOnFloor = mapData.textLabels.filter((t) => t.floor === activeFloorId);

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
              {MAPS[id].name}
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

        <div className="ml-auto flex gap-2">
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

          {tool === "placement" && (
            <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
              <p className="text-xs text-neutral-500">选干员</p>
              <select
                className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                value={activeOperatorId ?? ""}
                onChange={(e) => selectOperator(e.target.value || null)}
              >
                <option value="">未选择</option>
                {DEFENDERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
                {Object.keys(mapData.operators)
                  .filter((id) => !getDefender(id))
                  .map((id) => (
                    <option key={id} value={id}>
                      {mapData.operators[id].name}(自定义)
                    </option>
                  ))}
              </select>

              {activeOperatorId && (
                <>
                  <p className="text-xs text-neutral-500">选道具</p>
                  <select
                    className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    value={activeGadgetId ?? ""}
                    onChange={(e) => setActiveGadgetId(e.target.value || null)}
                  >
                    <option value="">未选择</option>
                    {getGadgetOptions(activeOperatorId).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                        {g.id === getDefender(activeOperatorId)?.gadget.id ? "(专属)" : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}

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
          )}

          <p className="mt-4 text-xs leading-relaxed text-neutral-400">
            墙体:依次点 3 次 = 起点 → 中点 → 终点,自动生成两片独立面板(各自可单独改状态/删除)。第 3 点点在中点附近则只生成一片。
            <br />
            文字标注:点一下放置,右侧改文字,给房间起名。
            <br />
            道具位:先选干员再选道具,点一下放置,拖动可定朝向。
            <br />
            选择模式下点击已有标记可编辑,拖动可调整位置。
            <br />
            快捷键:Esc 取消 · Delete 删除 · Ctrl+Z 撤销
          </p>
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1">
          <MapStage
            floor={floor}
            panningDisabled={tool !== "select"}
            onPointerDownImage={handlePointerDownImage}
            onPointerMoveImage={handlePointerMoveImage}
            onPointerUpImage={handlePointerUpImage}
          >
            {textLabelsOnFloor.map((label) => (
              <TextLabelMarker
                key={label.id}
                label={label}
                selected={selection?.kind === "textLabel" && selection.id === label.id}
                onClick={() => tool === "select" && setSelection({ kind: "textLabel", id: label.id })}
                onPointerDown={(e) => startDrag({ kind: "textLabel", id: label.id }, e)}
              />
            ))}

            {wallsOnFloor.map((wall) => (
              <WallLine
                key={wall.id}
                wall={wall}
                selected={selection?.kind === "wall" && selection.id === wall.id}
                onClick={() => tool === "select" && setSelection({ kind: "wall", id: wall.id })}
              />
            ))}

            {hatchesOnFloor.map((h) => (
              <PointMarker
                key={h.id}
                x={h.pos.x}
                y={h.pos.y}
                fill="#9333ea"
                shape="diamond"
                selected={selection?.kind === "hatch" && selection.id === h.id}
                onClick={() => tool === "select" && setSelection({ kind: "hatch", id: h.id })}
                onPointerDown={(e) => startDrag({ kind: "hatch", id: h.id }, e)}
              />
            ))}

            {rotatesOnFloor.map((r) => (
              <PointMarker
                key={r.id}
                x={r.pos.x}
                y={r.pos.y}
                fill="#ea580c"
                shape="triangle"
                selected={selection?.kind === "rotate" && selection.id === r.id}
                onClick={() => tool === "select" && setSelection({ kind: "rotate", id: r.id })}
                onPointerDown={(e) => startDrag({ kind: "rotate", id: r.id }, e)}
              />
            ))}

            {Object.entries(mapData.operators).flatMap(([opId, op]) =>
              op.placements
                .filter((p) => p.floor === activeFloorId)
                .map((p) => (
                  <PlacementMarker
                    key={p.id}
                    placement={p}
                    color={OPERATOR_COLOR[opId] ?? DEFAULT_OPERATOR_COLOR}
                    selected={selection?.kind === "placement" && selection.id === p.id}
                    onClick={() => tool === "select" && setSelection({ kind: "placement", operatorId: opId, id: p.id })}
                    onPointerDown={(e) => startDrag({ kind: "placement", operatorId: opId, id: p.id }, e)}
                  />
                ))
            )}

            {selectedWall && (
              <>
                <circle
                  cx={selectedWall.points[0].x}
                  cy={selectedWall.points[0].y}
                  r={9}
                  fill="#fff"
                  stroke="#111"
                  strokeWidth={2}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => startDrag({ kind: "wall-endpoint", id: selectedWall.id, which: 0 }, e)}
                />
                <circle
                  cx={selectedWall.points[1].x}
                  cy={selectedWall.points[1].y}
                  r={9}
                  fill="#fff"
                  stroke="#111"
                  strokeWidth={2}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => startDrag({ kind: "wall-endpoint", id: selectedWall.id, which: 1 }, e)}
                />
              </>
            )}

            {draft?.kind === "wall3" && (
              <>
                {draft.p2 === null ? (
                  <line
                    x1={draft.p1.x}
                    y1={draft.p1.y}
                    x2={draft.cursor.x}
                    y2={draft.cursor.y}
                    stroke={WALL_COLOR[draft.state]}
                    strokeWidth={6}
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <line
                      x1={draft.p1.x}
                      y1={draft.p1.y}
                      x2={draft.p2.x}
                      y2={draft.p2.y}
                      stroke={WALL_COLOR[draft.state]}
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                    <line
                      x1={draft.p2.x}
                      y1={draft.p2.y}
                      x2={draft.cursor.x}
                      y2={draft.cursor.y}
                      stroke={WALL_COLOR[draft.state]}
                      strokeWidth={6}
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    />
                  </>
                )}
                <circle cx={draft.p1.x} cy={draft.p1.y} r={6} fill="#fff" stroke={WALL_COLOR[draft.state]} strokeWidth={2} />
                {draft.p2 !== null && (
                  <circle cx={draft.p2.x} cy={draft.p2.y} r={6} fill="#fff" stroke={WALL_COLOR[draft.state]} strokeWidth={2} />
                )}
              </>
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
          {!selection && (
            <p className="text-sm text-neutral-400">
              左侧选个工具开始标注,或者切到「选择」模式点击已有标记查看/编辑。
            </p>
          )}
          {selection?.kind === "wall" && selectedWall && (
            <WallPanel wall={selectedWall} onPatch={(p) => patch((md) => ({ ...md, walls: md.walls.map((w) => (w.id === selectedWall.id ? { ...w, ...p } : w)) }))} onDelete={deleteSelection} />
          )}
          {selection?.kind === "hatch" && (
            <PointPanel
              title="天窗"
              note={hatchesOnFloor.find((h) => h.id === selection.id)?.note}
              onNoteChange={(note) => patch((md) => ({ ...md, hatches: md.hatches.map((h) => (h.id === selection.id ? { ...h, note } : h)) }))}
              onDelete={deleteSelection}
            />
          )}
          {selection?.kind === "rotate" && (
            <RotatePanel
              rotate={rotatesOnFloor.find((r) => r.id === selection.id)}
              onPatch={(p) => patch((md) => ({ ...md, rotates: md.rotates.map((r) => (r.id === selection.id ? { ...r, ...p } : r)) }))}
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
      <h2 className="text-sm font-semibold">墙体</h2>
      <label className="block text-xs text-neutral-500">
        状态
        <select
          value={wall.state}
          onChange={(e) => onPatch({ state: e.target.value as WallState })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {(Object.keys(WALL_STATE_LABEL) as WallState[]).map((s) => (
            <option key={s} value={s}>
              {WALL_STATE_LABEL[s]}
            </option>
          ))}
        </select>
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

function PointPanel({
  title,
  note,
  onNoteChange,
  onDelete,
}: {
  title: string;
  note?: string;
  onNoteChange: (note: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <label className="block text-xs text-neutral-500">
        说明
        <textarea
          value={note ?? ""}
          onChange={(e) => onNoteChange(e.target.value)}
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

function RotatePanel({
  rotate,
  onPatch,
  onDelete,
}: {
  rotate?: { note?: string; connectsTo?: string };
  onPatch: (patch: { note?: string; connectsTo?: string }) => void;
  onDelete: () => void;
}) {
  if (!rotate) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">转点洞</h2>
      <label className="block text-xs text-neutral-500">
        可转至(楼层 id)
        <input
          value={rotate.connectsTo ?? ""}
          onChange={(e) => onPatch({ connectsTo: e.target.value })}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        说明
        <textarea
          value={rotate.note ?? ""}
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
              {w.id} · {WALL_STATE_LABEL[w.state]}
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
