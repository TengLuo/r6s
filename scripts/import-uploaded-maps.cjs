/**
 * 一次性脚本:把用户从 Ubisoft 官网下载、解压到 public/maps/r6-maps-*-blueprints/
 * 的真实地图蓝图,整理成 public/maps/{mapId}/{floorId}.{ext} + 写入/更新
 * data/maps/{mapId}.json 的 floors 数组。跑完后源文件夹会被删除。
 *
 * 楼层顺序按用户确认的规则:有地下室的话地下室排最前,从低到高,最后一张永远是屋顶。
 * 用法:node scripts/import-uploaded-maps.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_ROOT = path.join(ROOT, "public", "maps");
const DATA_DIR = path.join(ROOT, "data", "maps");

function readPngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readJpegSize(buf) {
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9) break;
    const segLen = buf.readUInt16BE(offset + 2);
    const isSOF =
      (marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + segLen;
  }
  throw new Error("could not find JPEG SOF marker");
}

function readImageSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50) return readPngSize(buf);
  return readJpegSize(buf);
}

/**
 * floors: [{ src: 源文件绝对路径, id, name }, ...] 从低到高排列
 */
const MAPS = [
  {
    id: "bank",
    existing: true,
    floors: mk("r6-maps-bank-blueprints", "r6-maps-bank-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "calypso-casino",
    existing: true,
    floors: [
      { src: p("r6-maps-calypso-casino-blueprints", "R6S_Maps_CalypsoCasino_Basement.png"), id: "b1", name: "地下室" },
      { src: p("r6-maps-calypso-casino-blueprints", "R6S_Maps_CalypsoCasino_1F.png"), id: "1f", name: "1F" },
      { src: p("r6-maps-calypso-casino-blueprints", "R6S_Maps_CalypsoCasino_2F.png"), id: "2f", name: "2F" },
      { src: p("r6-maps-calypso-casino-blueprints", "R6S_Maps_CalypsoCasino_Roof.png"), id: "roof", name: "屋顶" },
    ],
  },
  {
    id: "chalet",
    existing: true,
    floors: mk("r6-maps-chalet-blueprints", "r6-maps-chalet-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "close-quarter",
    existing: false,
    name: "近距离战斗训练所 Close Quarter",
    floors: mk("r6-maps-closequarter-blueprints", "r6-maps-closequarter-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "roof", "屋顶"],
    ]),
  },
  {
    id: "clubhouse",
    existing: true,
    floors: mk("r6-maps-clubhouse-blueprints", "r6-maps-clubhouse-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "coastline",
    existing: true,
    floors: mk("r6-maps-coastline-blueprints", "r6-maps-coastline-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "roof", "屋顶"],
    ]),
  },
  {
    id: "consulate",
    existing: true,
    floors: mk(
      path.join("r6-maps-consulate-blueprints", "r6-maps-consulat-blueprints_may23"),
      "r6-maps-consulate-blueprint-",
      [
        ["1", "b1", "地下室"],
        ["2", "1f", "1F"],
        ["3", "2f", "2F"],
        ["4", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "emerald-plains",
    existing: true,
    floors: mk("r6-maps-emeraldplains-blueprints", "r6-maps-emeraldplains-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "roof", "屋顶"],
    ]),
  },
  {
    id: "favela",
    existing: false,
    name: "贫民窟 Favela",
    floors: mk(
      path.join("r6-maps-favela-blueprints", "r6-maps-favela-blueprints"),
      "r6-maps-favela-blueprint-",
      [
        ["1", "b1", "地下室"],
        ["2", "1f", "1F"],
        ["3", "2f", "2F"],
        ["4", "3f", "3F"],
        ["5", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "fortress",
    existing: false,
    name: "要塞 Fortress",
    floors: mk("r6-maps-fortress-blueprints", "r6-maps-fortress-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "roof", "屋顶"],
    ]),
  },
  {
    id: "hereford-base",
    existing: false,
    name: "赫里福德基地 Hereford Base",
    floors: mk("r6-maps-hereford-blueprints", "r6-maps-hereford-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "3f", "3F"],
      ["5", "roof", "屋顶"],
    ]),
  },
  {
    id: "house",
    existing: false,
    name: "民宅 House",
    floors: mk("r6-maps-house-blueprints", "r6-maps-house-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "roof", "屋顶(阁楼)"],
    ]),
  },
  {
    id: "kafe-dostoyevsky",
    existing: true,
    floors: mk("r6-maps-kafe-blueprints", "r6-maps-kafe-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "3f", "3F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "kanal",
    existing: true,
    floors: mk(
      path.join("r6-maps-kanal-blueprints", "r6-maps-kanal-blueprints"),
      "r6-maps-kanal-blueprint-",
      [
        ["1", "b1", "地下室"],
        ["2", "1f", "1F"],
        ["3", "2f", "2F"],
        ["4", "3f", "3F"],
        ["5", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "lair",
    existing: true,
    floors: mk(
      path.join("r6-maps-lair-blueprints", "r6-maps-lair-blueprints"),
      "r6-maps-lair-blueprint-",
      [
        ["1", "b1", "地下室"],
        ["2", "1f", "1F"],
        ["3", "2f", "2F"],
        ["4", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "nighthaven-labs",
    existing: true,
    floors: mk("r6-maps-nighthavenlabs-blueprints", "r6-maps-nighthavenlabs-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "oregon",
    existing: true,
    floors: mk("r6-maps-oregon-blueprints", "r6-maps-oregon-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "attic", "阁楼"],
      ["5", "roof", "屋顶"],
    ]),
  },
  {
    id: "outback",
    existing: true,
    floors: mk("r6-maps-outback-blueprints", "r6-maps-outback-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "roof", "屋顶"],
    ]),
  },
  {
    id: "plane",
    existing: false,
    name: "总统专机 Presidential Plane",
    floors: mk("r6-maps-plane-blueprints", "r6-maps-plane-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "3f", "3F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "skyscraper",
    existing: true,
    floors: mk("r6-maps-skyscraper-blueprints", "r6-maps-skyscraper-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "roof", "屋顶"],
    ]),
  },
  {
    id: "stadium-alpha",
    existing: false,
    name: "体育场 A Stadium Alpha",
    floors: mk(
      path.join("r6-maps-stadiumalpha-blueprints", "StadiumA-blueprints"),
      "StadiumA_0",
      [
        ["1", "f1", "F1"],
        ["2", "f2", "F2"],
        ["3", "f3", "F3"],
        ["4", "f4", "F4"],
        ["5", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "stadium-bravo",
    existing: false,
    name: "体育场 B Stadium Bravo",
    floors: mk(
      path.join("r6-maps-stadiumbravo-blueprints", "StadiumB-bluePrints"),
      "stadiumB_0",
      [
        ["1", "f1", "F1"],
        ["2", "f2", "F2"],
        ["3", "f3", "F3"],
        ["4", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "theme-park",
    existing: true,
    floors: mk(
      path.join("r6-maps-themepark-blueprints", "r6-maps-themepark-blueprints"),
      "r6-maps-themepark-blueprint-",
      [
        ["1", "1f", "1F"],
        ["2", "2f", "2F"],
        ["3", "roof", "屋顶"],
      ]
    ),
  },
  {
    id: "tower",
    existing: false,
    name: "塔楼 Tower",
    floors: mk("r6-maps-tower-blueprints", "r6-maps-tower-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "3f", "3F"],
      ["4", "roof", "屋顶"],
    ]),
  },
  {
    id: "villa",
    existing: true,
    floors: mk("r6-maps-villa-blueprints", "r6-maps-villa-blueprint-", [
      ["1", "b1", "地下室"],
      ["2", "1f", "1F"],
      ["3", "2f", "2F"],
      ["4", "3f", "3F"],
      ["5", "roof", "屋顶"],
    ]),
  },
  {
    id: "yacht",
    existing: false,
    name: "游艇 Yacht",
    floors: mk("r6-maps-yacht-blueprints", "r6-maps-yacht-blueprint-", [
      ["1", "1f", "1F"],
      ["2", "2f", "2F"],
      ["3", "3f", "3F"],
      ["4", "4f", "4F"],
      ["5", "roof", "屋顶"],
    ]),
  },
];

function p(...parts) {
  return path.join(SRC_ROOT, ...parts);
}

function mk(folder, prefix, entries) {
  return entries.map(([num, id, name]) => ({
    src: p(folder, `${prefix}${num}.jpg`),
    id,
    name,
  }));
}

let created = 0;
let updated = 0;
const skippedMaps = [];

for (const map of MAPS) {
  const outDir = path.join(SRC_ROOT, map.id);
  fs.mkdirSync(outDir, { recursive: true });

  const floors = [];
  let ok = true;
  for (const f of map.floors) {
    if (!fs.existsSync(f.src)) {
      console.log(`[跳过] ${map.id}: 找不到源文件 ${f.src}`);
      ok = false;
      break;
    }
    const ext = path.extname(f.src);
    const destRel = `/maps/${map.id}/${f.id}${ext}`;
    const destAbs = path.join(ROOT, "public", destRel);
    fs.copyFileSync(f.src, destAbs);
    const { width, height } = readImageSize(destAbs);
    floors.push({ id: f.id, name: f.name, image: destRel, imageSize: { width, height } });
  }
  if (!ok) {
    skippedMaps.push(map.id);
    continue;
  }

  const dataPath = path.join(DATA_DIR, `${map.id}.json`);
  if (map.existing) {
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    data.floors = floors;
    data._meta = { ...(data._meta || {}), isExampleData: false, note: "底图为用户从育碧官网下载的真实地图蓝图,战术标注待用 /editor 编辑器实际标注后填入。" };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    updated++;
  } else {
    const data = {
      _meta: { isExampleData: false, note: "底图为用户从育碧官网下载的真实地图蓝图,战术标注待用 /editor 编辑器实际标注后填入。" },
      id: map.id,
      name: map.name,
      floors,
      walls: [],
      openings: [],
      textLabels: [],
      operators: {},
      commonPlacements: [],
      presets: [],
    };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    created++;
  }
  console.log(`[完成] ${map.id}: ${floors.length} 层`);
}

console.log(`\n共更新 ${updated} 个已有地图,新建 ${created} 个地图。`);
if (skippedMaps.length) console.log("跳过(源文件缺失):", skippedMaps.join(", "));
