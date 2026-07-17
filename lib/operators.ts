/**
 * 防守方干员名单与专属道具参考数据。
 *
 * 覆盖范围截至开发时能确认的常规防守干员(约 Year 10 末~Year 11 初),
 * 最新一两个赛季刚加入的干员可能没收录进来——编辑器里"选干员"下拉旁边
 * 保留了"+ 自定义干员"入口,名单里没有的干员可以手动补。
 *
 * icon 字段只是约定路径(/ops/{id}.png),图标文件本身需要自行放进
 * public/ops/ 目录,放上去后 next/image 会自动显示,不用改代码。
 */

export interface GadgetInfo {
  id: string;
  name: string;
}

export interface DefenderInfo {
  id: string;
  name: string;
  gadget: GadgetInfo;
  icon: string;
}

/** 所有干员通用的道具,不绑定具体某个干员 */
export const COMMON_GADGETS: GadgetInfo[] = [
  { id: "camera", name: "摄像头" },
  { id: "deployable_shield", name: "部署盾" },
];

export const DEFENDERS: DefenderInfo[] = [
  { id: "alibi", name: "Alibi", gadget: { id: "prisma", name: "Prisma" }, icon: "/ops/alibi.png" },
  { id: "aruni", name: "Aruni", gadget: { id: "surya-gate", name: "Surya Gate" }, icon: "/ops/aruni.png" },
  { id: "azami", name: "Azami", gadget: { id: "kiba-barrier", name: "Kiba Barrier" }, icon: "/ops/azami.png" },
  { id: "bandit", name: "Bandit", gadget: { id: "shock-wire", name: "Shock Wire" }, icon: "/ops/bandit.png" },
  { id: "castle", name: "Castle", gadget: { id: "armor-panel", name: "Armor Panel" }, icon: "/ops/castle.png" },
  { id: "clash", name: "Clash", gadget: { id: "cce-shield", name: "CCE Shield" }, icon: "/ops/clash.png" },
  { id: "doc", name: "Doc", gadget: { id: "stim-pistol", name: "Stim Pistol" }, icon: "/ops/doc.png" },
  { id: "echo", name: "Echo", gadget: { id: "yokai", name: "Yokai Drone" }, icon: "/ops/echo.png" },
  { id: "ela", name: "Ela", gadget: { id: "grzmot-mine", name: "Grzmot Mine" }, icon: "/ops/ela.png" },
  { id: "fenrir", name: "Fenrir", gadget: { id: "sata", name: "SATA Devices" }, icon: "/ops/fenrir.png" },
  { id: "frost", name: "Frost", gadget: { id: "welcome-mat", name: "Welcome Mat" }, icon: "/ops/frost.png" },
  { id: "goyo", name: "Goyo", gadget: { id: "volcan-shield", name: "Volcán Shield" }, icon: "/ops/goyo.png" },
  { id: "jager", name: "Jäger", gadget: { id: "ads", name: "Active Defense System" }, icon: "/ops/jager.png" },
  { id: "kaid", name: "Kaid", gadget: { id: "electroclaw", name: "Electroclaw" }, icon: "/ops/kaid.png" },
  { id: "kapkan", name: "Kapkan", gadget: { id: "edd", name: "Entry Denial Device" }, icon: "/ops/kapkan.png" },
  { id: "lesion", name: "Lesion", gadget: { id: "gu-mine", name: "Gu Mine" }, icon: "/ops/lesion.png" },
  { id: "maestro", name: "Maestro", gadget: { id: "evil-eye", name: "Evil Eye" }, icon: "/ops/maestro.png" },
  { id: "melusi", name: "Melusi", gadget: { id: "banshee", name: "Banshee" }, icon: "/ops/melusi.png" },
  { id: "mira", name: "Mira", gadget: { id: "black-mirror", name: "Black Mirror" }, icon: "/ops/mira.png" },
  { id: "mozzie", name: "Mozzie", gadget: { id: "pest-launcher", name: "Pest Launcher" }, icon: "/ops/mozzie.png" },
  { id: "mute", name: "Mute", gadget: { id: "signal-disruptor", name: "Signal Disruptor" }, icon: "/ops/mute.png" },
  { id: "pulse", name: "Pulse", gadget: { id: "cardiac-sensor", name: "Cardiac Sensor" }, icon: "/ops/pulse.png" },
  { id: "rook", name: "Rook", gadget: { id: "armor-plate", name: "Armor Plate" }, icon: "/ops/rook.png" },
  { id: "smoke", name: "Smoke", gadget: { id: "remote-gas", name: "Remote Gas Grenade" }, icon: "/ops/smoke.png" },
  { id: "tachanka", name: "Tachanka", gadget: { id: "shumikha", name: "Shumikha Launcher" }, icon: "/ops/tachanka.png" },
  { id: "thorn", name: "Thorn", gadget: { id: "razorbloom", name: "Razorbloom Shell" }, icon: "/ops/thorn.png" },
  { id: "thunderbird", name: "Thunderbird", gadget: { id: "kona-station", name: "Kona Station" }, icon: "/ops/thunderbird.png" },
  { id: "tubarao", name: "Tubarão", gadget: { id: "zoto-canister", name: "Zoto Canister" }, icon: "/ops/tubarao.png" },
  { id: "valkyrie", name: "Valkyrie", gadget: { id: "black-eye", name: "Black Eye" }, icon: "/ops/valkyrie.png" },
  { id: "vigil", name: "Vigil", gadget: { id: "erc-7", name: "ERC-7" }, icon: "/ops/vigil.png" },
  { id: "wamai", name: "Wamai", gadget: { id: "mag-net", name: "Mag-NET System" }, icon: "/ops/wamai.png" },
  { id: "warden", name: "Warden", gadget: { id: "glance", name: "Glance Smart Glasses" }, icon: "/ops/warden.png" },
];

export function getDefender(id: string): DefenderInfo | undefined {
  return DEFENDERS.find((d) => d.id === id);
}

export function getGadgetOptions(defenderId: string | null): GadgetInfo[] {
  const defender = defenderId ? getDefender(defenderId) : undefined;
  return defender ? [defender.gadget, ...COMMON_GADGETS] : COMMON_GADGETS;
}

export function findGadgetName(gadgetId: string | undefined, defenderId?: string): string | undefined {
  if (!gadgetId) return undefined;
  const common = COMMON_GADGETS.find((g) => g.id === gadgetId);
  if (common) return common.name;
  const defender = defenderId ? getDefender(defenderId) : DEFENDERS.find((d) => d.gadget.id === gadgetId);
  return defender?.gadget.id === gadgetId ? defender.gadget.name : undefined;
}
