/**
 * 一次性脚本:用 r6operators 包的矢量头像数据生成 public/ops/{id}.svg,
 * 覆盖 lib/operators.ts 里 DEFENDERS 名单的每个干员。id 命名两边完全一致
 * (jager/tubarao/azami 等都不带变音符号),不需要额外映射表。
 * 用法:node scripts/generate-operator-icons.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const r6 = require("r6operators");

const data = r6.default || r6;

const outDir = path.join(__dirname, "..", "public", "ops");
fs.mkdirSync(outDir, { recursive: true });

// 从 lib/operators.ts 里粗略抓出 id 列表(避免在 .cjs 脚本里 import TS 文件)
const opsSource = fs.readFileSync(path.join(__dirname, "..", "lib", "operators.ts"), "utf8");
const ids = [...opsSource.matchAll(/id:\s*"([a-z0-9_-]+)"/g)].map((m) => m[1]);

let ok = 0;
let missing = [];
for (const id of ids) {
  const op = data[id];
  if (!op || typeof op.toSVG !== "function") {
    missing.push(id);
    continue;
  }
  const svg = op.toSVG();
  fs.writeFileSync(path.join(outDir, `${id}.svg`), svg, "utf8");
  ok++;
}

console.log(`生成完成:${ok} 个头像写入 public/ops/`);
if (missing.length) console.log("r6operators 里没找到的 id:", missing.join(", "));
