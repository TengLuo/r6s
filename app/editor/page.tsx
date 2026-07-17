import type { Metadata } from "next";
import MapEditor from "@/components/MapEditor";

export const metadata: Metadata = {
  title: "地图标注编辑器 · R6 装修攻略",
};

export default function EditorPage() {
  return <MapEditor />;
}
