import { OPENING_PURPOSE_COLOR, OPENING_PURPOSE_GLYPH } from "@/lib/schema";
import type { Opening, Placement, TextLabel, Wall } from "@/lib/schema";

/** 封墙统一用一个颜色,不再分必封/禁封/情况三态 */
export const WALL_COLOR = "#dc2626";

export const OPERATOR_COLOR: Record<string, string> = {
  mira: "#ec4899",
  valkyrie: "#06b6d4",
};

export const DEFAULT_OPERATOR_COLOR = "#16a34a";

/** 通用道具位(不挂在具体干员名下)统一用这个中性色,跟干员配色区分开 */
export const COMMON_GADGET_COLOR = "#64748b";

/** 干员配色:优先用 OPERATOR_COLOR 里手动指定的,否则按 id 哈希出一个稳定的颜色,
 * 保证地图上标注了多个干员时颜色不会全部撞成 DEFAULT_OPERATOR_COLOR */
export function getOperatorColor(operatorId: string): string {
  if (OPERATOR_COLOR[operatorId]) return OPERATOR_COLOR[operatorId];
  let hash = 0;
  for (let i = 0; i < operatorId.length; i++) {
    hash = operatorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

type SvgPointerHandler = (e: React.PointerEvent<SVGGElement>) => void;

export function WallLine({
  wall,
  highlighted,
  selected,
  scale = 1,
  onClick,
  onMovePointerDown,
}: {
  wall: Wall;
  highlighted?: boolean;
  selected?: boolean;
  /** 徽章整体缩放倍数,不影响墙线本身粗细 */
  scale?: number;
  onClick?: () => void;
  /** 拖拽墙中点的"墙"字徽章,整段墙平移(不改变长度/角度) */
  onMovePointerDown?: SvgPointerHandler;
}) {
  const [p1, p2] = wall.points;
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const label = wall.count && wall.count > 1 ? `墙×${wall.count}` : "墙";
  const effScale = scale * (wall.size ?? 1);
  const fontSize = 14 * effScale;
  const paddingX = 6 * effScale;
  const badgeHeight = 26 * effScale;
  const badgeWidth = Math.max(label.length * fontSize * 0.72 + paddingX * 2, badgeHeight);
  return (
    <g>
      <g onClick={onClick} style={{ cursor: "pointer" }}>
        {/* 加宽的透明线,单纯用来扩大可点击/可触摸区域,不影响视觉 */}
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={24} />
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={WALL_COLOR}
          strokeWidth={highlighted || selected ? 10 : 6}
          strokeLinecap="round"
          opacity={highlighted ? 1 : 0.9}
          strokeDasharray={selected ? "4 6" : undefined}
        >
          {highlighted && (
            <animate attributeName="opacity" values="1;0.25;1" dur="0.8s" repeatCount="indefinite" />
          )}
        </line>
      </g>
      {/* 墙中点的"墙"字徽章:既是视觉标注,也是整段墙拖拽平移的手柄 */}
      <g
        onClick={onClick}
        onPointerDown={onMovePointerDown}
        style={{ cursor: "grab" }}
        transform={`translate(${mid.x} ${mid.y}) rotate(${wall.rotation ?? 0})`}
      >
        <rect x={-badgeWidth / 2 - 6} y={-badgeHeight / 2 - 6} width={badgeWidth + 12} height={badgeHeight + 12} fill="transparent" />
        {selected && (
          <rect
            x={-badgeWidth / 2 - 3}
            y={-badgeHeight / 2 - 3}
            width={badgeWidth + 6}
            height={badgeHeight + 6}
            rx={5}
            fill="none"
            stroke="#fff"
            strokeWidth={2}
            strokeDasharray="3 4"
          />
        )}
        <rect
          x={-badgeWidth / 2}
          y={-badgeHeight / 2}
          width={badgeWidth}
          height={badgeHeight}
          rx={4}
          fill={WALL_COLOR}
          stroke="#fff"
          strokeWidth={2}
        />
        <text
          x={0}
          y={1}
          fill="#fff"
          fontSize={fontSize}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ userSelect: "none" }}
        >
          {label}
        </text>
      </g>
    </g>
  );
}

/** 洞口徽章:彩色圆角方块 + 单字标识用途(翻/过/枪/脚/跳),比抽象形状更容易一眼看懂 */
export function OpeningMarker({
  opening,
  selected,
  scale = 1,
  onClick,
  onPointerDown,
}: {
  opening: Opening;
  selected?: boolean;
  scale?: number;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const effScale = scale * (opening.size ?? 1);
  const size = 15 * effScale;
  const color = OPENING_PURPOSE_COLOR[opening.purpose];
  const glyph = OPENING_PURPOSE_GLYPH[opening.purpose];
  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{ cursor: "pointer" }}
      transform={`translate(${opening.pos.x} ${opening.pos.y}) rotate(${opening.rotation ?? 0})`}
    >
      <circle r={size + 8} fill="transparent" />
      {selected && (
        <rect
          x={-size - 4}
          y={-size - 4}
          width={(size + 4) * 2}
          height={(size + 4) * 2}
          rx={6}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeDasharray="3 4"
        />
      )}
      <rect x={-size} y={-size} width={size * 2} height={size * 2} rx={5} fill={color} stroke="#fff" strokeWidth={2} />
      <text
        x={0}
        y={1}
        fill="#fff"
        fontSize={16 * effScale}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ userSelect: "none" }}
      >
        {glyph}
      </text>
    </g>
  );
}

export function TextLabelMarker({
  label,
  selected,
  scale = 1,
  onClick,
  onPointerDown,
}: {
  label: TextLabel;
  selected?: boolean;
  scale?: number;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const effScale = scale * (label.size ?? 1);
  const fontSize = 20 * effScale;
  const paddingX = 8 * effScale;
  const width = Math.max(label.text.length * fontSize * 0.62 + paddingX * 2, 24 * effScale);
  const height = fontSize + 10 * effScale;
  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{ cursor: "pointer" }}
      transform={`translate(${label.pos.x} ${label.pos.y}) rotate(${label.rotation ?? 0})`}
    >
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={6}
        fill="rgba(0,0,0,0.55)"
        stroke={selected ? "#fff" : "none"}
        strokeWidth={selected ? 2 : 0}
        strokeDasharray={selected ? "3 4" : undefined}
      />
      <text
        x={0}
        y={1}
        fill="#fff"
        fontSize={fontSize}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontWeight: 600, userSelect: "none" }}
      >
        {label.text}
      </text>
    </g>
  );
}

/** 视野扇形路径:以 facing 为中心角,左右各展开 halfAngle 度的一个扇形(饼图切片) */
function fanPath(facingDeg: number, radius: number, halfAngleDeg: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const a1 = toRad(facingDeg - halfAngleDeg);
  const a2 = toRad(facingDeg + halfAngleDeg);
  const x1 = radius * Math.cos(a1);
  const y1 = radius * Math.sin(a1);
  const x2 = radius * Math.cos(a2);
  const y2 = radius * Math.sin(a2);
  return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

export function PlacementMarker({
  placement,
  color,
  icon,
  selected,
  scale = 1,
  onClick,
  onPointerDown,
}: {
  placement: Placement;
  color: string;
  /** 干员头像,有的话画在标记圆点里,没有就退回纯色圆点 */
  icon?: string;
  selected?: boolean;
  scale?: number;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const { x, y } = placement.pos;
  const radius = 16 * scale * (placement.size ?? 1);
  const alternative = placement.tier === "alternative";
  const markerOpacity = alternative ? 0.55 : 1;
  const clipId = `placement-clip-${placement.id}`;
  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{ cursor: "pointer" }}
      transform={`translate(${x} ${y})`}
    >
      <circle r={radius + 8} fill="transparent" />
      {selected && <circle r={radius + 6} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="3 4" />}
      {typeof placement.facing === "number" && (
        <path d={fanPath(placement.facing, radius * 5, 35)} fill={color} opacity={alternative ? 0.14 : 0.25} />
      )}
      {icon ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle r={radius} />
            </clipPath>
          </defs>
          <circle r={radius} fill="#1a1a1a" opacity={markerOpacity} />
          <image
            href={icon}
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
            clipPath={`url(#${clipId})`}
            opacity={markerOpacity}
            preserveAspectRatio="xMidYMid slice"
            transform={typeof placement.facing === "number" ? `rotate(${placement.facing})` : undefined}
          />
          <circle r={radius} fill="none" stroke={color} strokeWidth={3} opacity={markerOpacity} />
        </>
      ) : (
        <circle r={radius} fill={color} stroke="#fff" strokeWidth={3} opacity={markerOpacity} />
      )}
      {typeof placement.facing === "number" && (
        <line
          x1={0}
          y1={0}
          x2={radius * 2.2 * Math.cos((placement.facing * Math.PI) / 180)}
          y2={radius * 2.2 * Math.sin((placement.facing * Math.PI) / 180)}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={markerOpacity}
        />
      )}
    </g>
  );
}
