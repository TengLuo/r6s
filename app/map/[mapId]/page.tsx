import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MapPageClient from "@/components/MapPageClient";
import { getMapData, listMaps } from "@/lib/maps";

export function generateStaticParams() {
  return listMaps().map((map) => ({ mapId: map.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mapId: string }>;
}): Promise<Metadata> {
  const { mapId } = await params;
  const mapData = getMapData(mapId);
  return { title: mapData ? `${mapData.name} · R6 装修攻略` : "地图未找到" };
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;
  const mapData = getMapData(mapId);
  if (!mapData) notFound();

  return <MapPageClient mapData={mapData} />;
}
