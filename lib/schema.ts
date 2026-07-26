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
  /** 英文楼层名,留空则英文界面回退显示 name */
  nameEn?: string;
  /** 底图路径,相对 /public,例如 /maps/border/2f.png */
  image: string;
  /** 底图原始像素尺寸,所有该楼层下的坐标都以此为参考系 */
  imageSize: FloorSize;
}

export interface Wall {
  id: string;
  floor: string;
  /** 线段两端点,像素坐标 */
  points: [Point, Point];
  /** 这段墙包含几片可加固面板,省略或 1 表示单片,徽章上显示"墙×N" */
  count?: number;
  /** 「墙」徽章的单独缩放倍数(不影响墙线长度/粗细),省略视为 1 */
  size?: number;
  /** 「墙」徽章的旋转角度,单位度,只转徽章本身,不影响墙线的两个端点,省略视为 0 */
  rotation?: number;
  note?: string;
}

/**
 * 洞口用途:
 * - vault 翻越洞:需要翻窗动作才能过去的大洞,动作慢、有硬直
 * - walkthrough 过人洞:不用翻窗,直接走/蹲过去
 * - gunfight 对枪洞:胸口/头部高度,专门用来对枪的小洞
 * - foot 脚洞:贴地小洞,打脚踝角度
 * - floor 跳层洞:打穿地板/天花板临时换楼层(区别于固定结构的天窗)
 */
export type OpeningPurpose = "vault" | "walkthrough" | "gunfight" | "foot" | "floor";

export interface Opening {
  id: string;
  floor: string;
  pos: Point;
  purpose: OpeningPurpose;
  /** 仅 floor(跳层洞)类型有意义:通向的楼层 id */
  connectsTo?: string;
  /** 徽章的单独缩放倍数,省略视为 1 */
  size?: number;
  /** 徽章的旋转角度,单位度,省略视为 0 */
  rotation?: number;
  note?: string;
}

/** 文字标注,主要用来标房间名 */
export interface TextLabel {
  id: string;
  floor: string;
  pos: Point;
  text: string;
  /** 文字/底板的单独缩放倍数,省略视为 1 */
  size?: number;
  /** 文字/底板的旋转角度,单位度,省略视为 0 */
  rotation?: number;
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
  /** 标记点的单独缩放倍数,省略视为 1 */
  size?: number;
  /**
   * 图标本身的旋转角度,单位度,独立于 facing。facing 只管视野扇形指向哪,
   * iconRotation 只管头像/道具图标图片本身转到哪个角度,两者互不影响。
   */
  iconRotation?: number;
}

/**
 * 手绘标注的种类:
 * - pen 画笔:自由手绘,用 perfect-freehand 渲染成带笔锋的漂亮笔迹
 * - highlighter 荧光笔:半透明粗线,涂区域不遮底图
 * - line 直线 / arrow 箭头:两点式,标对枪线/进攻方向
 * - rect 矩形 / ellipse 圆圈:两点式(对角),圈重点区域
 */
export type DrawingKind = "pen" | "highlighter" | "line" | "arrow" | "rect" | "ellipse";

export interface Drawing {
  id: string;
  floor: string;
  kind: DrawingKind;
  /** pen/highlighter 是抽稀后的轨迹点;line/arrow/rect/ellipse 只有 [起点, 终点] 两个点 */
  points: Point[];
  color: string;
  /** 笔画基准粗细,底图像素单位 */
  width: number;
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
  /** 该方案下启用的道具位 id 列表;省略时表示全部启用 */
  activePlacementIds?: string[];
}

export interface MapData {
  id: string;
  name: string;
  /** 英文地图名,留空则英文界面回退显示 name */
  nameEn?: string;
  floors: Floor[];
  walls: Wall[];
  openings: Opening[];
  textLabels: TextLabel[];
  operators: Record<string, OperatorData>;
  /**
   * 不挂在具体某个干员名下的通用道具位(摄像头/部署盾/手雷之类,任何干员都能摆)。
   * 跟 openings 一样是独立于干员的标记,不需要先选干员才能标注。
   */
  commonPlacements: Placement[];
  /** 手绘标注(画笔/荧光笔/直线/箭头/矩形/圆圈),per 楼层,随导出导入走 */
  drawings: Drawing[];
  presets: Preset[];
}

export const OPENING_PURPOSE_LABEL: Record<OpeningPurpose, string> = {
  vault: "翻越洞",
  walkthrough: "过人洞",
  gunfight: "对枪洞",
  foot: "脚洞",
  floor: "跳层洞",
};

/** 洞口徽章上显示的单字 */
export const OPENING_PURPOSE_GLYPH: Record<OpeningPurpose, string> = {
  vault: "翻",
  walkthrough: "过",
  gunfight: "枪",
  foot: "脚",
  floor: "跳",
};

export const OPENING_PURPOSE_COLOR: Record<OpeningPurpose, string> = {
  vault: "#ea580c",
  walkthrough: "#2563eb",
  gunfight: "#dc2626",
  foot: "#7c2d12",
  floor: "#ca8a04",
};

/** MapViewer 点击标记后向外抛出的统一事件负载 */
export type SelectedMarker =
  | { kind: "wall"; data: Wall }
  | { kind: "opening"; data: Opening }
  | { kind: "textLabel"; data: TextLabel }
  | { kind: "placement"; data: Placement; operatorId: string; operatorName: string }
  | { kind: "commonPlacement"; data: Placement };
