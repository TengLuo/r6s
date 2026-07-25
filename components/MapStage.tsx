"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { Floor } from "@/lib/schema";

const MIN_SCALE = 0.5;
const MAX_SCALE = 6;

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
  /** 右键单击地图(阻止浏览器默认菜单后触发),常用于"取消当前工具,回到选择/拖动" */
  onContextMenu?: (e: React.MouseEvent) => void;
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
  { floor, children, panningDisabled, onPointerDownImage, onPointerMoveImage, onPointerUpImage, onContextMenu },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const { width, height } = floor.imageSize;

  /** 让底图默认就撑满可视区域(而不是按图片原始像素 1:1 显示导致看起来很小),
   * 用外层容器实际尺寸算出"刚好完整装下整张图"的缩放倍数。 */
  const fitToView = () => {
    const zoomRef = transformRef.current;
    const wrapperEl = zoomRef?.instance.wrapperComponent;
    if (!zoomRef || !wrapperEl || !wrapperEl.clientWidth || !wrapperEl.clientHeight) return;
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min(wrapperEl.clientWidth / width, wrapperEl.clientHeight / height))
    );
    zoomRef.centerView(scale, 0);
  };

  // 楼层/底图切换(尺寸可能不同)时也重新适配一次
  useEffect(() => {
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

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

  const wrap = (handler?: PointerHandler, primaryOnly?: boolean) =>
    handler
      ? (e: React.PointerEvent<SVGSVGElement>) => {
          // 右键(button 2)不当画图/放置操作处理,只用来弹出 onContextMenu 取消当前工具
          if (primaryOnly && e.button !== 0) return;
          const point = toImagePoint(e.clientX, e.clientY);
          if (point) handler(point, e);
        }
      : undefined;

  return (
    <TransformWrapper
      ref={transformRef}
      minScale={MIN_SCALE}
      maxScale={MAX_SCALE}
      centerOnInit
      onInit={fitToView}
      doubleClick={{ mode: "toggle" }}
      panning={{ disabled: panningDisabled }}
      wheel={{ step: 0.0015 }}
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
            onPointerDown={wrap(onPointerDownImage, true)}
            onPointerMove={wrap(onPointerMoveImage)}
            onPointerUp={wrap(onPointerUpImage)}
            onContextMenu={(e) => {
              if (!onContextMenu) return;
              e.preventDefault();
              onContextMenu(e);
            }}
          >
            {children}
          </svg>
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
});

export default MapStage;
