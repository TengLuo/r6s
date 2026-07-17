/**
 * 地图数据类型定义。所有坐标(Point, points, pos)均为相对底图原始像素坐标系
 * (原点在图片左上角),不是屏幕/视口坐标 —— 渲染时由 MapViewer 统一换算成
 * SVG viewBox 坐标,不要在其他地方做换算。
 */

export interface Point {
  x: number;
  y: number;
}

export interface FloorSize {
  width: number;
  height: number;
}

export interface Floor {
  id: string;
  name: string;
  /** 底图路径,相对 /public,例如 /maps/border/2f.png */
  image: string;
  /** 底图原始像素尺寸,所有该楼层下的坐标都以此为参考系 */
  imageSize: FloorSize;
}

export type WallState = "must_reinforce" | "never_reinforce" | "situational";

export interface Wall {
  id: string;
  floor: string;
  state: WallState;
  /** 线段两端点,像素坐标 */
  points: [Point, Point];
  note?: string;
}

export interface Hatch {
  id: string;
  floor: string;
  pos: Point;
  note?: string;
}

export interface Rotate {
  id: string;
  floor: string;
  pos: Point;
  /** 转到的楼层 id,便于查看器提示"可转至 X 楼" */
  connectsTo?: string;
  note?: string;
}

/** 文字标注,主要用来标房间名 */
export interface TextLabel {
  id: string;
  floor: string;
  pos: Point;
  text: string;
}

export type PlacementTier = "core" | "alternative";

export interface Placement {
  id: string;
  floor: string;
  pos: Point;
  title: string;
  description: string;
  /**
   * 朝向角度,单位度,0 = 正右方,顺时针递增。
   * 黑镜类道具(需要绘制视野扇形)必填,其余可省略。
   */
  facing?: number;
  tier: PlacementTier;
  /** 该道具依赖的墙体 id,详情展开时该墙体应高亮 */
  requiresWall?: string;
  /** 实拍截图路径,相对 /public,例如 /shots/border/mira-1.webp */
  screenshot?: string;
  /** 道具 id:干员专属道具或通用道具(camera/deployable_shield),对应 lib/operators.ts */
  gadgetId?: string;
}

export interface OperatorData {
  name: string;
  /** 头像图标路径,相对 /public */
  icon?: string;
  placements: Placement[];
}

export interface Preset {
  id: string;
  name: string;
  isDefault?: boolean;
  /** 该方案下对默认墙体状态的覆盖,key 为 wall id */
  wallOverrides?: Record<string, WallState>;
  /** 该方案下启用的道具位 id 列表;省略时表示全部启用 */
  activePlacementIds?: string[];
}

export interface MapData {
  id: string;
  name: string;
  floors: Floor[];
  walls: Wall[];
  hatches: Hatch[];
  rotates: Rotate[];
  textLabels: TextLabel[];
  operators: Record<string, OperatorData>;
  presets: Preset[];
}

export const WALL_STATE_LABEL: Record<WallState, string> = {
  must_reinforce: "必封墙",
  never_reinforce: "禁封墙",
  situational: "情况墙",
};

/** MapViewer 点击标记后向外抛出的统一事件负载 */
export type SelectedMarker =
  | { kind: "wall"; data: Wall }
  | { kind: "hatch"; data: Hatch }
  | { kind: "rotate"; data: Rotate }
  | { kind: "textLabel"; data: TextLabel }
  | { kind: "placement"; data: Placement; operatorId: string; operatorName: string };
