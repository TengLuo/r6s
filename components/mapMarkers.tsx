import type { Placement, TextLabel, Wall, WallState } from "@/lib/schema";

export const WALL_COLOR: Record<WallState, string> = {
  must_reinforce: "#dc2626",
  never_reinforce: "#2563eb",
  situational: "#d97706",
};

export const OPERATOR_COLOR: Record<string, string> = {
  mira: "#ec4899",
  valkyrie: "#06b6d4",
};

export const DEFAULT_OPERATOR_COLOR = "#16a34a";

type SvgPointerHandler = (e: React.PointerEvent<SVGGElement>) => void;

export function WallLine({
  wall,
  highlighted,
  selected,
  onClick,
  onPointerDown,
}: {
  wall: Wall;
  highlighted?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const [p1, p2] = wall.points;
  const color = WALL_COLOR[wall.state];
  return (
    <g onClick={onClick} onPointerDown={onPointerDown} style={{ cursor: "pointer" }}>
      {/* 加宽的透明线,单纯用来扩大可点击/可触摸区域,不影响视觉 */}
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={24} />
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
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
  );
}

export function PointMarker({
  x,
  y,
  fill,
  shape,
  selected,
  onClick,
  onPointerDown,
}: {
  x: number;
  y: number;
  fill: string;
  shape: "diamond" | "triangle";
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const size = 14;
  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{ cursor: "pointer" }}
      transform={`translate(${x} ${y})`}
    >
      <circle r={size + 8} fill="transparent" />
      {selected && <circle r={size + 6} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="3 4" />}
      {shape === "diamond" ? (
        <rect
          x={-size}
          y={-size}
          width={size * 2}
          height={size * 2}
          transform="rotate(45)"
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
        />
      ) : (
        <polygon
          points={`0,${-size} ${size},${size} ${-size},${size}`}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
        />
      )}
    </g>
  );
}

export function TextLabelMarker({
  label,
  selected,
  onClick,
  onPointerDown,
}: {
  label: TextLabel;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const fontSize = 20;
  const paddingX = 8;
  const width = Math.max(label.text.length * fontSize * 0.62 + paddingX * 2, 24);
  const height = fontSize + 10;
  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{ cursor: "pointer" }}
      transform={`translate(${label.pos.x} ${label.pos.y})`}
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

export function PlacementMarker({
  placement,
  color,
  selected,
  onClick,
  onPointerDown,
}: {
  placement: Placement;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: SvgPointerHandler;
}) {
  const { x, y } = placement.pos;
  const radius = 16;
  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{ cursor: "pointer" }}
      transform={`translate(${x} ${y})`}
    >
      <circle r={radius + 8} fill="transparent" />
      {selected && <circle r={radius + 6} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="3 4" />}
      <circle r={radius} fill={color} stroke="#fff" strokeWidth={3} />
      {typeof placement.facing === "number" && (
        <line
          x1={0}
          y1={0}
          x2={radius * 2.2 * Math.cos((placement.facing * Math.PI) / 180)}
          y2={radius * 2.2 * Math.sin((placement.facing * Math.PI) / 180)}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}
