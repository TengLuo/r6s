import type { Floor, MapData } from "@/lib/schema";
import { pick, type Locale } from "@/lib/i18n";
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
import favela from "@/data/maps/favela.json";
import fortress from "@/data/maps/fortress.json";
import herefordBase from "@/data/maps/hereford-base.json";
import house from "@/data/maps/house.json";
import plane from "@/data/maps/plane.json";
import tower from "@/data/maps/tower.json";
import yacht from "@/data/maps/yacht.json";

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
  fortress: fortress as unknown as MapData,
};

/** 不在当前排位池里的地图(退环境/竞技赛专用/测试图等),单独一份名单,
 * 首页会分成两个区块展示,不跟排位地图的统计数字混在一起。 */
export const OTHER_MAPS: Record<string, MapData> = {
  favela: favela as unknown as MapData,
  "hereford-base": herefordBase as unknown as MapData,
  house: house as unknown as MapData,
  plane: plane as unknown as MapData,
  tower: tower as unknown as MapData,
  yacht: yacht as unknown as MapData,
};

/** 编辑器"从已注册地图加载"下拉用:排位池 + 其他地图合并成一份完整名单 */
export const ALL_MAPS: Record<string, MapData> = { ...MAPS, ...OTHER_MAPS };

export function getMapData(mapId: string): MapData | undefined {
  return ALL_MAPS[mapId];
}

export function listMaps(): MapData[] {
  return Object.values(MAPS);
}

export function listOtherMaps(): MapData[] {
  return Object.values(OTHER_MAPS);
}

export function getMapName(map: MapData, lang: Locale): string {
  return pick(map.name, map.nameEn, lang);
}

export function getFloorName(floor: Floor, lang: Locale): string {
  return pick(floor.name, floor.nameEn, lang);
}

/** 该图是否已有真实/示例战术标注内容,还是仅有占位底图 */
export function isMapAnnotated(map: MapData): boolean {
  const hasPlacements = Object.values(map.operators).some((op) => op.placements.length > 0);
  return (
    map.walls.length > 0 ||
    map.openings.length > 0 ||
    hasPlacements ||
    map.commonPlacements.length > 0 ||
    (map.drawings?.length ?? 0) > 0
  );
}
