import type { MapData } from "@/lib/schema";
import border from "@/data/maps/border.json";
import bank from "@/data/maps/bank.json";
import chalet from "@/data/maps/chalet.json";
import clubhouse from "@/data/maps/clubhouse.json";
import consulate from "@/data/maps/consulate.json";
import kafeDostoyevsky from "@/data/maps/kafe-dostoyevsky.json";
import lair from "@/data/maps/lair.json";
import nighthavenLabs from "@/data/maps/nighthaven-labs.json";
import calypsoCasino from "@/data/maps/calypso-casino.json";
import oregon from "@/data/maps/oregon.json";
import villa from "@/data/maps/villa.json";
import coastline from "@/data/maps/coastline.json";
import themePark from "@/data/maps/theme-park.json";
import kanal from "@/data/maps/kanal.json";
import emeraldPlains from "@/data/maps/emerald-plains.json";
import outback from "@/data/maps/outback.json";
import skyscraper from "@/data/maps/skyscraper.json";

// 顺序即首页展示顺序:先放已有完整标注的图,其余按常见排位池顺序排列。
export const MAPS: Record<string, MapData> = {
  border: border as unknown as MapData,
  bank: bank as unknown as MapData,
  chalet: chalet as unknown as MapData,
  clubhouse: clubhouse as unknown as MapData,
  consulate: consulate as unknown as MapData,
  "kafe-dostoyevsky": kafeDostoyevsky as unknown as MapData,
  lair: lair as unknown as MapData,
  "nighthaven-labs": nighthavenLabs as unknown as MapData,
  "calypso-casino": calypsoCasino as unknown as MapData,
  oregon: oregon as unknown as MapData,
  villa: villa as unknown as MapData,
  coastline: coastline as unknown as MapData,
  "theme-park": themePark as unknown as MapData,
  kanal: kanal as unknown as MapData,
  "emerald-plains": emeraldPlains as unknown as MapData,
  outback: outback as unknown as MapData,
  skyscraper: skyscraper as unknown as MapData,
};

export function getMapData(mapId: string): MapData | undefined {
  return MAPS[mapId];
}

export function listMaps(): MapData[] {
  return Object.values(MAPS);
}

/** 该图是否已有真实/示例战术标注内容,还是仅有占位底图 */
export function isMapAnnotated(map: MapData): boolean {
  const hasPlacements = Object.values(map.operators).some((op) => op.placements.length > 0);
  return map.walls.length > 0 || map.hatches.length > 0 || map.rotates.length > 0 || hasPlacements;
}
