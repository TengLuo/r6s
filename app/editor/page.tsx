import type { Metadata } from "next";
import MapEditor from "@/components/MapEditor";

export const metadata: Metadata = {
  title: "地图标注编辑器 · R6 装修攻略",
};

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ map?: string }>;
}) {
  const { map } = await searchParams;
  return <MapEditor initialMapId={map} />;
}
