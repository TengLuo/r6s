/**
 * 进攻/防守干员名单与专属道具参考数据。
 *
 * 数据来源:干员名单 id/角色取自 r6operators 包(见 scripts/generate-operator-icons.cjs),
 * 专属道具名逐个核对自 Ubisoft 官网干员页面(ubisoft.com/.../game-info/operators/{id})。
 * 少数干员(Sentry/Striker)官方设定为"无专属道具,可选全部通用道具",gadget 字段留空。
 *
 * icon 字段指向 public/ops/{id}.svg —— 用 r6operators 包(npm)生成的矢量头像,
 * 见 scripts/generate-operator-icons.cjs。名单里新增干员时,先跑一遍这个脚本
 * 补生成头像,r6operators 里没有的 id(自定义干员)图标会缺失,界面会自动
 * fallback 成首字母圆形头像。
 */

import { pick, type Locale } from "@/lib/i18n";

export type OperatorRole = "attack" | "defend";

export interface GadgetInfo {
  id: string;
  name: string;
  /** 英文名,目前只有通用道具(COMMON_GADGETS_*)会填;干员专属道具本身就是英文名 */
  nameEn?: string;
  /** 图标路径,相对 /public,例如 /gadgets/proximity_alarm.avif;没有就留空,界面会退化成占位圆点 */
  icon?: string;
}

export interface OperatorInfo {
  id: string;
  name: string;
  role: OperatorRole;
  /** 专属道具,Sentry/Striker 这类"无专属、全选通用道具"的干员留空 */
  gadget?: GadgetInfo;
  icon: string;
}

/** 防守方通用道具(不绑定具体干员,官方"防守干员通用装备"列表) */
export const COMMON_GADGETS_DEFEND: GadgetInfo[] = [
  { id: "camera", name: "防弹摄像头", nameEn: "Bulletproof Camera", icon: "/gadgets/defend/camera.avif" },
  { id: "deployable_shield", name: "部署盾", nameEn: "Deployable Shield", icon: "/gadgets/defend/deployable_shield.avif" },
  { id: "barbed_wire", name: "铁丝网", nameEn: "Barbed Wire", icon: "/gadgets/defend/barbed_wire.webp" },
  { id: "observation_blocker", name: "侦查阻断器", nameEn: "Observation Blocker", icon: "/gadgets/defend/observation_blocker.avif" },
  { id: "impact_grenade", name: "冲击手雷", nameEn: "Impact Grenade", icon: "/gadgets/defend/impact_grenade.avif" },
  { id: "nitro_cell", name: "硝化炸药", nameEn: "Nitro Cell", icon: "/gadgets/defend/nitro_cell.avif" },
  { id: "proximity_alarm", name: "警报传感器", nameEn: "Proximity Alarm", icon: "/gadgets/defend/proximity_alarm.avif" },
];

/** 进攻方通用道具(官方"进攻干员通用装备"列表) */
export const COMMON_GADGETS_ATTACK: GadgetInfo[] = [
  { id: "breach_charge", name: "破坏装置", nameEn: "Breach Charge", icon: "/gadgets/attack/breach_charge.avif" },
  { id: "claymore", name: "诡雷", nameEn: "Claymore", icon: "/gadgets/attack/claymore.avif" },
  { id: "frag_grenade", name: "破片手雷", nameEn: "Frag Grenade", icon: "/gadgets/attack/frag_grenade.avif" },
  { id: "hard_breach_charge", name: "硬破坏装置", nameEn: "Hard Breach Charge", icon: "/gadgets/attack/hard_breach_charge.avif" },
  { id: "smoke_grenade", name: "烟雾弹", nameEn: "Smoke Grenade", icon: "/gadgets/attack/smoke_grenade.avif" },
  { id: "stun_grenade", name: "眩晕手雷", nameEn: "Stun Grenade", icon: "/gadgets/attack/stun_grenade.avif" },
  { id: "impact_emp_grenade", name: "冲击电磁手雷", nameEn: "Impact EMP Grenade", icon: "/gadgets/attack/impact_emp_grenade.png" },
];

export const DEFENDERS: OperatorInfo[] = [
  { id: "alibi", name: "Alibi", role: "defend", gadget: { id: "prisma", name: "Prisma" }, icon: "/ops/alibi.svg" },
  { id: "aruni", name: "Aruni", role: "defend", gadget: { id: "surya-gate", name: "Surya Gate" }, icon: "/ops/aruni.svg" },
  { id: "azami", name: "Azami", role: "defend", gadget: { id: "kiba-barrier", name: "Kiba Barrier" }, icon: "/ops/azami.svg" },
  { id: "bandit", name: "Bandit", role: "defend", gadget: { id: "shock-wire", name: "Shock Wire" }, icon: "/ops/bandit.svg" },
  { id: "castle", name: "Castle", role: "defend", gadget: { id: "armor-panel", name: "Armor Panel" }, icon: "/ops/castle.svg" },
  { id: "caveira", name: "Caveira", role: "defend", gadget: { id: "silent-step", name: "Silent Step" }, icon: "/ops/caveira.svg" },
  { id: "clash", name: "Clash", role: "defend", gadget: { id: "cce-shield", name: "CCE Shield" }, icon: "/ops/clash.svg" },
  { id: "denari", name: "Denari", role: "defend", gadget: { id: "trip-connector", name: "T.R.I.P. Connector" }, icon: "/ops/denari.svg" },
  { id: "doc", name: "Doc", role: "defend", gadget: { id: "stim-pistol", name: "Stim Pistol" }, icon: "/ops/doc.svg" },
  { id: "echo", name: "Echo", role: "defend", gadget: { id: "yokai", name: "Yokai Drone" }, icon: "/ops/echo.svg" },
  { id: "ela", name: "Ela", role: "defend", gadget: { id: "grzmot-mine", name: "Grzmot Mine" }, icon: "/ops/ela.svg" },
  { id: "fenrir", name: "Fenrir", role: "defend", gadget: { id: "sata", name: "SATA Devices" }, icon: "/ops/fenrir.svg" },
  { id: "frost", name: "Frost", role: "defend", gadget: { id: "welcome-mat", name: "Welcome Mat" }, icon: "/ops/frost.svg" },
  { id: "goyo", name: "Goyo", role: "defend", gadget: { id: "volcan-shield", name: "Volcán Shield" }, icon: "/ops/goyo.svg" },
  { id: "jager", name: "Jäger", role: "defend", gadget: { id: "ads", name: "Active Defense System" }, icon: "/ops/jager.svg" },
  { id: "kaid", name: "Kaid", role: "defend", gadget: { id: "electroclaw", name: "Electroclaw" }, icon: "/ops/kaid.svg" },
  { id: "kapkan", name: "Kapkan", role: "defend", gadget: { id: "edd", name: "Entry Denial Device" }, icon: "/ops/kapkan.svg" },
  { id: "lesion", name: "Lesion", role: "defend", gadget: { id: "gu-mine", name: "Gu Mine" }, icon: "/ops/lesion.svg" },
  { id: "maestro", name: "Maestro", role: "defend", gadget: { id: "evil-eye", name: "Evil Eye" }, icon: "/ops/maestro.svg" },
  { id: "melusi", name: "Melusi", role: "defend", gadget: { id: "banshee", name: "Banshee" }, icon: "/ops/melusi.svg" },
  { id: "mira", name: "Mira", role: "defend", gadget: { id: "black-mirror", name: "Black Mirror" }, icon: "/ops/mira.svg" },
  { id: "mozzie", name: "Mozzie", role: "defend", gadget: { id: "pest-launcher", name: "Pest Launcher" }, icon: "/ops/mozzie.svg" },
  { id: "mute", name: "Mute", role: "defend", gadget: { id: "signal-disruptor", name: "Signal Disruptor" }, icon: "/ops/mute.svg" },
  { id: "oryx", name: "Oryx", role: "defend", gadget: { id: "remah-dash", name: "Remah Dash" }, icon: "/ops/oryx.svg" },
  { id: "pulse", name: "Pulse", role: "defend", gadget: { id: "cardiac-sensor", name: "Cardiac Sensor" }, icon: "/ops/pulse.svg" },
  { id: "rook", name: "Rook", role: "defend", gadget: { id: "armor-plate", name: "Armor Plate" }, icon: "/ops/rook.svg" },
  { id: "sentry", name: "Sentry", role: "defend", icon: "/ops/sentry.svg" },
  { id: "skopos", name: "Skopós", role: "defend", gadget: { id: "v10-pantheon-shells", name: "V10 Pantheon Shells" }, icon: "/ops/skopos.svg" },
  { id: "smoke", name: "Smoke", role: "defend", gadget: { id: "remote-gas", name: "Remote Gas Grenade" }, icon: "/ops/smoke.svg" },
  { id: "solis", name: "Solis", role: "defend", gadget: { id: "spec-io-electro-sensor", name: "Spec-IO Electro-Sensor" }, icon: "/ops/solis.svg" },
  { id: "tachanka", name: "Tachanka", role: "defend", gadget: { id: "shumikha", name: "Shumikha Launcher" }, icon: "/ops/tachanka.svg" },
  { id: "thorn", name: "Thorn", role: "defend", gadget: { id: "razorbloom", name: "Razorbloom Shell" }, icon: "/ops/thorn.svg" },
  { id: "thunderbird", name: "Thunderbird", role: "defend", gadget: { id: "kona-station", name: "Kona Station" }, icon: "/ops/thunderbird.svg" },
  { id: "tubarao", name: "Tubarão", role: "defend", gadget: { id: "zoto-canister", name: "Zoto Canister" }, icon: "/ops/tubarao.svg" },
  { id: "valkyrie", name: "Valkyrie", role: "defend", gadget: { id: "black-eye", name: "Black Eye" }, icon: "/ops/valkyrie.svg" },
  { id: "vigil", name: "Vigil", role: "defend", gadget: { id: "erc-7", name: "ERC-7" }, icon: "/ops/vigil.svg" },
  { id: "wamai", name: "Wamai", role: "defend", gadget: { id: "mag-net", name: "Mag-NET System" }, icon: "/ops/wamai.svg" },
  { id: "warden", name: "Warden", role: "defend", gadget: { id: "glance", name: "Glance Smart Glasses" }, icon: "/ops/warden.svg" },
];

export const ATTACKERS: OperatorInfo[] = [
  { id: "ace", name: "Ace", role: "attack", gadget: { id: "selma", name: "S.E.L.M.A. Aqua Breacher" }, icon: "/ops/ace.svg" },
  { id: "amaru", name: "Amaru", role: "attack", gadget: { id: "garra-hook", name: "Garra Hook" }, icon: "/ops/amaru.svg" },
  { id: "ash", name: "Ash", role: "attack", gadget: { id: "breaching-round", name: "Breaching Round" }, icon: "/ops/ash.svg" },
  { id: "blackbeard", name: "Blackbeard", role: "attack", gadget: { id: "hull-shield", name: "H.U.L.L. Adaptable Shield" }, icon: "/ops/blackbeard.svg" },
  { id: "blitz", name: "Blitz", role: "attack", gadget: { id: "g52-shield", name: "G52-Tactical Shield" }, icon: "/ops/blitz.svg" },
  { id: "brava", name: "Brava", role: "attack", gadget: { id: "kludge-drone", name: "Kludge Drone" }, icon: "/ops/brava.svg" },
  { id: "buck", name: "Buck", role: "attack", gadget: { id: "skeleton-key", name: "Skeleton Key" }, icon: "/ops/buck.svg" },
  { id: "capitao", name: "Capitão", role: "attack", gadget: { id: "tactical-crossbow", name: "Tactical Crossbow" }, icon: "/ops/capitao.svg" },
  { id: "deimos", name: "Deimos", role: "attack", gadget: { id: "deathmark-tracker", name: "Deathmark Tracker" }, icon: "/ops/deimos.svg" },
  { id: "dokkaebi", name: "Dokkaebi", role: "attack", gadget: { id: "jegeo-payload", name: "Jegeo Payload" }, icon: "/ops/dokkaebi.svg" },
  { id: "finka", name: "Finka", role: "attack", gadget: { id: "adrenal-surge", name: "Adrenal Surge" }, icon: "/ops/finka.svg" },
  { id: "flores", name: "Flores", role: "attack", gadget: { id: "rce-ratero-charge", name: "RCE-Ratero Charge" }, icon: "/ops/flores.svg" },
  { id: "fuze", name: "Fuze", role: "attack", gadget: { id: "cluster-charge", name: "Cluster Charge" }, icon: "/ops/fuze.svg" },
  { id: "glaz", name: "Glaz", role: "attack", gadget: { id: "flip-sight", name: "Flip Sight" }, icon: "/ops/glaz.svg" },
  { id: "gridlock", name: "Gridlock", role: "attack", gadget: { id: "trax-stingers", name: "Trax Stingers" }, icon: "/ops/gridlock.svg" },
  { id: "grim", name: "Grim", role: "attack", gadget: { id: "kawan-hive-launcher", name: "Kawan Hive Launcher" }, icon: "/ops/grim.svg" },
  { id: "hibana", name: "Hibana", role: "attack", gadget: { id: "x-kairos", name: "X-KAIRO" }, icon: "/ops/hibana.svg" },
  { id: "iana", name: "Iana", role: "attack", gadget: { id: "gemini-replicator", name: "Gemini Replicator" }, icon: "/ops/iana.svg" },
  { id: "iq", name: "IQ", role: "attack", gadget: { id: "electronics-detector", name: "Electronics Detector" }, icon: "/ops/iq.svg" },
  { id: "jackal", name: "Jackal", role: "attack", gadget: { id: "eyenox", name: "Eyenox Model III" }, icon: "/ops/jackal.svg" },
  { id: "kali", name: "Kali", role: "attack", gadget: { id: "lv-explosive-lance", name: "LV Explosive Lance" }, icon: "/ops/kali.svg" },
  { id: "lion", name: "Lion", role: "attack", gadget: { id: "ee-one-d", name: "EE-ONE-D" }, icon: "/ops/lion.svg" },
  { id: "maverick", name: "Maverick", role: "attack", gadget: { id: "breaching-torch", name: "Breaching Torch" }, icon: "/ops/maverick.svg" },
  { id: "montagne", name: "Montagne", role: "attack", gadget: { id: "le-roc-shield", name: "Le Roc Shield" }, icon: "/ops/montagne.svg" },
  { id: "nokk", name: "Nøkk", role: "attack", gadget: { id: "hel-presence-reduction", name: "HEL Presence Reduction" }, icon: "/ops/nokk.svg" },
  { id: "nomad", name: "Nomad", role: "attack", gadget: { id: "airjab-launcher", name: "Airjab Launcher" }, icon: "/ops/nomad.svg" },
  { id: "osa", name: "Osa", role: "attack", gadget: { id: "talon-8-shield", name: "Talon-8 Clear Shield" }, icon: "/ops/osa.svg" },
  { id: "ram", name: "Ram", role: "attack", gadget: { id: "bu-gi-auto-breacher", name: "BU-GI Auto Breacher" }, icon: "/ops/ram.svg" },
  { id: "rauora", name: "Rauora", role: "attack", gadget: { id: "dom-panel-launcher", name: "D.O.M. Panel Launcher" }, icon: "/ops/rauora.svg" },
  { id: "sens", name: "Sens", role: "attack", gadget: { id: "rou-projector", name: "R.O.U. Projector System" }, icon: "/ops/sens.svg" },
  { id: "sledge", name: "Sledge", role: "attack", gadget: { id: "breaching-hammer", name: "Breaching Hammer" }, icon: "/ops/sledge.svg" },
  { id: "striker", name: "Striker", role: "attack", icon: "/ops/striker.svg" },
  { id: "thatcher", name: "Thatcher", role: "attack", gadget: { id: "egs-disruptor", name: "E.G.S. Disruptor" }, icon: "/ops/thatcher.svg" },
  { id: "thermite", name: "Thermite", role: "attack", gadget: { id: "exothermic-charge", name: "Exothermic Charge" }, icon: "/ops/thermite.svg" },
  { id: "twitch", name: "Twitch", role: "attack", gadget: { id: "shock-drone", name: "Shock Drone" }, icon: "/ops/twitch.svg" },
  { id: "ying", name: "Ying", role: "attack", gadget: { id: "candela", name: "Candela" }, icon: "/ops/ying.svg" },
  { id: "zero", name: "Zero", role: "attack", gadget: { id: "argus-launcher", name: "Argus Launcher" }, icon: "/ops/zero.svg" },
  { id: "zofia", name: "Zofia", role: "attack", gadget: { id: "ks79-lifeline", name: "KS79 Lifeline" }, icon: "/ops/zofia.svg" },
];

export const OPERATORS: OperatorInfo[] = [...DEFENDERS, ...ATTACKERS];

export function getOperatorInfo(id: string): OperatorInfo | undefined {
  return OPERATORS.find((d) => d.id === id);
}

export function getOperatorsByRole(role: OperatorRole): OperatorInfo[] {
  return OPERATORS.filter((d) => d.role === role);
}

export function getGadgetOptions(operatorId: string | null): GadgetInfo[] {
  const operator = operatorId ? getOperatorInfo(operatorId) : undefined;
  const common = operator?.role === "attack" ? COMMON_GADGETS_ATTACK : COMMON_GADGETS_DEFEND;
  return operator?.gadget ? [operator.gadget, ...common] : common;
}

export function findGadgetName(gadgetId: string | undefined, operatorId?: string, lang: Locale = "zh"): string | undefined {
  if (!gadgetId) return undefined;
  const common = [...COMMON_GADGETS_DEFEND, ...COMMON_GADGETS_ATTACK].find((g) => g.id === gadgetId);
  if (common) return pick(common.name, common.nameEn, lang);
  const operator = operatorId ? getOperatorInfo(operatorId) : OPERATORS.find((d) => d.gadget?.id === gadgetId);
  return operator?.gadget?.id === gadgetId ? operator.gadget.name : undefined;
}

/** 通用道具在 UI 上显示的名字,按语言取 name/nameEn */
export function getGadgetDisplayName(gadget: GadgetInfo, lang: Locale): string {
  return pick(gadget.name, gadget.nameEn, lang);
}

/** 通用道具位(不挂靠干员)的标记图标用:按 gadgetId 找对应的通用道具图片 */
export function getCommonGadgetIcon(gadgetId: string | undefined): string | undefined {
  if (!gadgetId) return undefined;
  return [...COMMON_GADGETS_DEFEND, ...COMMON_GADGETS_ATTACK].find((g) => g.id === gadgetId)?.icon;
}
