"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Floor } from "@/lib/schema";

export interface ImagePoint {
  x: number;
  y: number;
}

export interface MapStageHandle {
  toImagePoint: (clientX: number, clientY: number) => ImagePoint | null;
}

type PointerHandler = (point: ImagePoint, e: React.PointerEvent<SVGSVGElement>) => void;

interface MapStageProps {
  floor: Floor;
  children?: React.ReactNode;
  /** 编辑器绘制/拖拽时需要临时关闭 react-zoom-pan-pinch 的单指拖动平移,避免手势冲突 */
  panningDisabled?: boolean;
  onPointerDownImage?: PointerHandler;
  onPointerMoveImage?: PointerHandler;
  onPointerUpImage?: PointerHandler;
}

/**
 * 复用自 MapViewer 的坐标系骨架(img + svg 共享同一套像素坐标,细节见 MapViewer.tsx 顶部注释)。
 * 额外提供 toImagePoint:把一次点击/拖拽的浏览器坐标(clientX/clientY)转换回"底图原始像素坐标",
 * 编辑器画墙、放置图标都靠这个换算。
 *
 * 换算用的是原生 SVG API:svg.getScreenCTM() 返回"SVG 用户坐标 -> 屏幕坐标"的变换矩阵,
 * 它已经把 react-zoom-pan-pinch 施加的 CSS transform(缩放+平移)、以及页面滚动等所有上级变换
 * 都算在内了,所以只需要取它的逆矩阵 .inverse(),就能把一次点击的屏幕坐标精确地映射回图片像素坐标,
 * 完全不用自己手动追踪当前缩放倍数/平移量。
 */
const MapStage = forwardRef<MapStageHandle, MapStageProps>(function MapStage(
  { floor, children, panningDisabled, onPointerDownImage, onPointerMoveImage, onPointerUpImage },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = floor.imageSize;

  const toImagePoint = (clientX: number, clientY: number): ImagePoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  useImperativeHandle(ref, () => ({ toImagePoint }), []);

  const wrap = (handler?: PointerHandler) =>
    handler
      ? (e: React.PointerEvent<SVGSVGElement>) => {
          const point = toImagePoint(e.clientX, e.clientY);
          if (point) handler(point, e);
        }
      : undefined;

  return (
    <TransformWrapper
      minScale={0.5}
      maxScale={6}
      centerOnInit
      doubleClick={{ mode: "toggle" }}
      panning={{ disabled: panningDisabled }}
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{ width, height }}
      >
        <div style={{ position: "relative", width, height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={floor.image}
            alt={floor.name}
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, width, height, userSelect: "none" }}
            draggable={false}
          />
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, touchAction: panningDisabled ? "none" : undefined }}
            onPointerDown={wrap(onPointerDownImage)}
            onPointerMove={wrap(onPointerMoveImage)}
            onPointerUp={wrap(onPointerUpImage)}
          >
            {children}
          </svg>
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
});

export default MapStage;
